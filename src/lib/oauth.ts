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

export function callbackUrl(baseUrl: string, id: ProviderId): string {
  const base = (process.env.APP_URL?.trim() || baseUrl).replace(/\/$/, "");
  return `${base}/api/auth/callback/${id}`;
}

export function buildAuthorizeUrl(id: ProviderId, redirectUri: string, state: string): string {
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
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

export async function exchangeCode(
  id: ProviderId,
  code: string,
  redirectUri: string,
): Promise<OAuthProfile> {
  const { clientId, clientSecret } = credentials(id);

  if (id === "google") {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
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
      picture?: string;
    };

    return {
      provider: "google",
      providerId: info.sub,
      name: info.name?.trim() || info.email?.split("@")[0] || "Usuario",
      email: info.email?.toLowerCase() ?? null,
      image: info.picture ?? null,
    };
  }

  const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenRes = await fetch(tokenUrl);
  if (!tokenRes.ok) throw new Error("Facebook rechazó el código de acceso.");
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Facebook no devolvió el token.");

  const infoUrl = new URL("https://graph.facebook.com/v21.0/me");
  infoUrl.searchParams.set("fields", "id,name,email,picture.type(large)");
  infoUrl.searchParams.set("access_token", access_token);

  const infoRes = await fetch(infoUrl);
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
  };
}
