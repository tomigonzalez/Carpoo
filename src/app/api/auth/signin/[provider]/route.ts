import { NextResponse, type NextRequest } from "next/server";
import { buildAuthorizeUrl, callbackUrl, isConfigured, type ProviderId } from "@/lib/oauth";
import { safeNext } from "@/lib/action-state";

/**
 * Paso 1 del ingreso con Google/Facebook: mandamos a la persona a la pantalla
 * de la red social. Guardamos un "state" en una cookie para evitar fraudes.
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

  const next = safeNext(request.nextUrl.searchParams.get("next"));
  const state = crypto.randomUUID();

  const response = NextResponse.redirect(
    new URL(buildAuthorizeUrl(id, callbackUrl(request.nextUrl.origin, id), state)),
  );
  response.cookies.set("carpoo_oauth", JSON.stringify({ state, provider: id, next }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutos para completar el ingreso
    path: "/",
  });
  return response;
}
