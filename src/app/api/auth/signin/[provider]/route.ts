import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl, callbackUrl, isConfigured, type ProviderId } from "@/lib/oauth";
import { crearEstadoOAuth, OAUTH_COOKIE } from "@/lib/oauth-state";
import { safeNext } from "@/lib/action-state";

/**
 * Paso 1 del ingreso con Google/Facebook: mandamos a la persona a la pantalla
 * de la red social. Guardamos un "state" firmado en una cookie para evitar
 * fraudes; con Google además generamos el verifier de PKCE.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/auth/signin/[provider]">) {
  const { provider } = await ctx.params;
  const id = provider as ProviderId;

  if (id !== "google" && id !== "facebook") {
    return NextResponse.redirect(new URL("/ingresar?error=config", request.url));
  }
  if (!isConfigured(id)) {
    return NextResponse.redirect(new URL("/ingresar?error=config", request.url));
  }

  const next = safeNext(request.nextUrl.searchParams.get("next"), request.url);
  const state = randomUUID();

  // PKCE S256 solo para Google (Facebook no lo soporta en este flujo).
  const verifier = id === "google" ? randomBytes(32).toString("base64url") : undefined;
  const challenge = verifier
    ? createHash("sha256").update(verifier).digest("base64url")
    : undefined;

  let authorizeUrl: string;
  let cookieValue: string;
  try {
    authorizeUrl = buildAuthorizeUrl(id, callbackUrl(request.url, id), state, challenge);
    cookieValue = crearEstadoOAuth({ state, provider: id, next, verifier });
  } catch {
    return NextResponse.redirect(new URL("/ingresar?error=config", request.url));
  }

  const response = NextResponse.redirect(new URL(authorizeUrl));
  response.cookies.set(OAUTH_COOKIE, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutos para completar el ingreso
    path: "/",
  });
  return response;
}
