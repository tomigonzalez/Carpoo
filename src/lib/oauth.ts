/**
 * Inicio de sesión con Google y Facebook (flujo OAuth 2.0 "authorization code").
 *
 * Elegimos implementarlo directo, sin librerías extra, porque son solo 3 pasos:
 *   1. Mandar al usuario a la pantalla de la red social.
 *   2. La red social vuelve con un "code".
 *   3. Cambiamos ese code por los datos del perfil.
 *
 * Si las claves no están configuradas, el proveedor se muestra deshabilitado
 * (la app nunca falla en medio del login).
 */

export type ProviderId = "google" | "facebook";

export type OAuthProfile = {
  provider: ProviderId;
  providerId: string;
  name: string;
  email: string | null;
  image: string | null;
  /** Google lo informa; Facebook no, así que ahí es false y no vinculamos cuentas. */
  emailVerified: boolean;
};

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  configured: boolean;
};

const SCOPES: Record<ProviderId, string> = {
  google: "openid email profile",
  facebook: "email,public_profile",
};

function credentials(id: ProviderId): { clientId: string; clientSecret: string } {
  const clientId =
    id === "google" ? process.env.GOOGLE_CLIENT_ID : process.env.FACEBOOK_CLIENT_ID;
  const clientSecret =
    id === "google"
      ? process.env.GOOGLE_CLIENT_SECRET
      : process.env.FACEBOOK_CLIENT_SECRET;
  return { clientId: clientId?.trim() ?? "", clientSecret: clientSecret?.trim() ?? "" };
}

export function isConfigured(id: ProviderId): boolean {
  const { clientId, clientSecret } = credentials(id);
  return Boolean(clientId && clientSecret);
}

export function listProviders(): ProviderInfo[] {
  return [
    { id: "google", label: "Continuar con Google", configured: isConfigured("google") },
    { id: "facebook", label: "Continuar con Facebook", configured: isConfigured("facebook") },
  ];
}

/** Origin público configurado. En producción APP_URL es obligatoria (no Host). */
function publicOrigin(fallback: string): string {
  const configurada = process.env.APP_URL?.trim();
  if (configurada) {
    try {
      const url = new URL(configurada);
      if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
    } catch {
      // Sigue con el fallback de desarrollo.
    }
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_URL falta o es inválida; es obligatoria en producción.");
  }
  return new URL(fallback).origin;
}

export function callbackUrl(baseUrl: string, id: ProviderId): string {
  return `${publicOrigin(baseUrl)}/api/auth/callback/${id}`;
}

export function buildAuthorizeUrl(
  id: ProviderId,
  redirectUri: string,
  state: string,
  codeChallenge?: string,
): string {
  const { clientId } = credentials(id);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES[id],
    state,
  });

  if (id === "google") {
    params.set("access_type", "online");
    params.set("prompt", "select_account");
    // PKCE S256: Google lo acepta en el flujo de servidor y ata el code a esta app.
    if (codeChallenge) {
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

export async function exchangeCode(
  id: ProviderId,
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<OAuthProfile> {
  const { clientId, clientSecret } = credentials(id);

  if (id === "google") {
    const tokenBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    if (codeVerifier) tokenBody.set("code_verifier", codeVerifier);

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    if (!tokenRes.ok) throw new Error("Google rechazó el código de acceso.");
    const { access_token } = (await tokenRes.json()) as { access_token?: string };
    if (!access_token) throw new Error("Google no devolvió el token.");

    const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) throw new Error("No pudimos leer el perfil de Google.");
    const info = (await infoRes.json()) as {
      sub: string;
      name?: string;
      email?: string;
      email_verified?: boolean;
      picture?: string;
    };

    return {
      provider: "google",
      providerId: info.sub,
      name: info.name?.trim() || info.email?.split("@")[0] || "Usuario",
      email: info.email?.toLowerCase() ?? null,
      image: info.picture ?? null,
      emailVerified: info.email_verified === true,
    };
  }

  // POST y header Bearer para que ni el client_secret ni el token queden en una URL.
  const tokenRes = await fetch("https://graph.facebook.com/v21.0/oauth/access_token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });
  if (!tokenRes.ok) throw new Error("Facebook rechazó el código de acceso.");
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Facebook no devolvió el token.");

  const infoUrl = new URL("https://graph.facebook.com/v21.0/me");
  infoUrl.searchParams.set("fields", "id,name,email,picture.type(large)");

  const infoRes = await fetch(infoUrl, {
    headers: { authorization: `Bearer ${access_token}` },
  });
  if (!infoRes.ok) throw new Error("No pudimos leer el perfil de Facebook.");
  const info = (await infoRes.json()) as {
    id: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };

  return {
    provider: "facebook",
    providerId: info.id,
    name: info.name?.trim() || "Usuario",
    email: info.email?.toLowerCase() ?? null,
    image: info.picture?.data?.url ?? null,
    // Graph no confirma la verificación del email: no lo usamos para vincular cuentas.
    emailVerified: false,
  };
}
