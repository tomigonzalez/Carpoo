import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";
import type { User } from "@prisma/client";

const COOKIE_NAME = "carpoo_sesion";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "Falta AUTH_SECRET en el archivo .env (usá una cadena larga y aleatoria).",
    );
  }
  return new TextEncoder().encode(value);
}

/** Guarda la sesión del usuario en una cookie firmada (no se puede falsificar). */
export async function createSession(userId: string) {
  const token = await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Devuelve el usuario logueado o null. Nunca lanza si la cookie es inválida. */
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const uid = payload.uid;
    if (typeof uid !== "string") return null;
    return await prisma.user.findUnique({ where: { id: uid } });
  } catch {
    return null;
  }
}

/** Igual que getCurrentUser pero corta la ejecución pidiendo login. */
export async function requireUser(nextPath = "/"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/ingresar?volver=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

/**
 * El perfil está "listo" cuando tiene nombre, foto y teléfono verificado.
 * Sin esto no se puede publicar ni reservar (regla anti-perfiles-falsos).
 */
export function isProfileComplete(user: User): boolean {
  return Boolean(user.name && user.image && user.phoneVerified);
}

export function missingProfileItems(user: User): string[] {
  const falta: string[] = [];
  if (!user.image) falta.push("foto de perfil");
  if (!user.phoneVerified) falta.push("teléfono verificado");
  return falta;
}
