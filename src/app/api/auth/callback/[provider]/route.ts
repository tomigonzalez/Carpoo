import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { callbackUrl, exchangeCode, type ProviderId } from "@/lib/oauth";
import { leerEstadoOAuth, OAUTH_COOKIE } from "@/lib/oauth-state";
import { safeNext } from "@/lib/action-state";

/**
 * Paso 2: la red social nos devuelve un "code", lo cambiamos por el perfil,
 * creamos o actualizamos la cuenta y abrimos la sesión.
 *
 * Regla de vinculación: un email ya usado por otra cuenta nunca se pisa. Solo
 * se reutiliza la cuenta si el proveedor confirma el email y es el mismo
 * proveedor (evita que un perfil social ajeno tome una cuenta existente).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/auth/callback/[provider]">) {
  const { provider } = await ctx.params;
  const id = provider as ProviderId;

  // Toda salida limpia la cookie: si no, un state viejo queda reutilizable.
  const fail = (motivo: string) => {
    const respuesta = NextResponse.redirect(new URL(`/ingresar?error=${motivo}`, request.url));
    respuesta.cookies.delete(OAUTH_COOKIE);
    return respuesta;
  };

  if (id !== "google" && id !== "facebook") return fail("config");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const guardado = leerEstadoOAuth(request.cookies.get(OAUTH_COOKIE)?.value);

  if (!code || !state || !guardado) return fail("estado");
  if (guardado.state !== state || guardado.provider !== id) return fail("estado");
  // El verifier de PKCE solo existe en el flujo de Google.
  if ((id === "google") !== Boolean(guardado.verifier)) return fail("estado");

  try {
    const profile = await exchangeCode(
      id,
      code,
      callbackUrl(request.url, id),
      guardado.verifier,
    );

    const porProveedor = await prisma.user.findUnique({
      where: {
        provider_providerId: { provider: id, providerId: profile.providerId },
      },
    });
    const porEmail = profile.email
      ? await prisma.user.findUnique({ where: { email: profile.email } })
      : null;

    if (porEmail && porProveedor && porEmail.id !== porProveedor.id) {
      return fail("cuenta");
    }
    if (porEmail && !porProveedor && (!profile.emailVerified || porEmail.provider !== id)) {
      return fail("cuenta");
    }

    const user =
      porProveedor ??
      porEmail ??
      (await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email,
          image: profile.image,
          provider: id,
          providerId: profile.providerId,
          lastLoginAt: new Date(),
        },
      }));

    if (porProveedor || porEmail) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || profile.name,
          image: user.image || profile.image,
          lastLoginAt: new Date(),
        },
      });
    }

    await createSession(user.id);

    const respuesta = NextResponse.redirect(new URL(safeNext(guardado.next, request.url)));
    respuesta.cookies.delete(OAUTH_COOKIE);
    return respuesta;
  } catch {
    // Sin mensaje ni stack: un error de fetch puede traer la URL con client_secret.
    console.error("[Carpoo] Error en el ingreso con", id);
    return fail(id);
  }
}
