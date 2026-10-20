import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { callbackUrl, exchangeCode, type ProviderId } from "@/lib/oauth";
import { safeNext } from "@/lib/action-state";

/**
 * Paso 2: la red social nos devuelve un "code", lo cambiamos por el perfil,
 * creamos o actualizamos la cuenta y abrimos la sesión.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/auth/callback/[provider]">) {
  const { provider } = await ctx.params;
  const id = provider as ProviderId;

  const fail = (motivo: string) =>
    NextResponse.redirect(new URL(`/ingresar?error=${motivo}`, request.url));

  if (id !== "google" && id !== "facebook") return fail("config");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const rawCookie = request.cookies.get("carpoo_oauth")?.value;

  if (!code || !state || !rawCookie) return fail("estado");

  let saved: { state: string; provider: string; next: string };
  try {
    saved = JSON.parse(rawCookie);
  } catch {
    return fail("estado");
  }

  if (saved.state !== state || saved.provider !== id) return fail("estado");

  try {
    const profile = await exchangeCode(id, code, callbackUrl(request.nextUrl.origin, id));

    // Si ya existe una cuenta con ese email, la reutilizamos (una persona = una cuenta).
    const existingByEmail = profile.email
      ? await prisma.user.findUnique({ where: { email: profile.email } })
      : null;

    const user = existingByEmail
      ? await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            name: existingByEmail.name || profile.name,
            image: existingByEmail.image || profile.image,
            provider: id,
            providerId: profile.providerId,
            lastLoginAt: new Date(),
          },
        })
      : await prisma.user.upsert({
          where: { provider_providerId: { provider: id, providerId: profile.providerId } },
          update: {
            name: profile.name,
            email: profile.email,
            image: profile.image,
            lastLoginAt: new Date(),
          },
          create: {
            name: profile.name,
            email: profile.email,
            image: profile.image,
            provider: id,
            providerId: profile.providerId,
            lastLoginAt: new Date(),
          },
        });

    await createSession(user.id);

    const response = NextResponse.redirect(new URL(safeNext(saved.next), request.url));
    response.cookies.delete("carpoo_oauth");
    return response;
  } catch (error) {
    console.error("[Carpoo] Error en el ingreso:", error);
    return fail(id);
  }
}
