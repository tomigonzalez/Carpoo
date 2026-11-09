"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/session";
import { hasVerificationProvider, isDemoMode, sendVerificationCode } from "@/lib/notify";
import { cleanImageUrl, cleanText, generatePhoneCode, normalizePhone } from "@/lib/validate";
import { safeNext, type ActionState } from "@/lib/action-state";

function emailValido(email: string | null): email is string {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

/**
 * Acceso de prueba con un email, sin depender de Google/Facebook.
 * Sirve para probar la app localmente. Se apaga con DEMO_LOGIN="false".
 */
export async function loginWithDemo(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isDemoMode()) {
    return { error: "El acceso de prueba está desactivado." };
  }

  const email = cleanText(formData.get("email"), 120)?.toLowerCase();
  if (!email || !email.includes("@") || !email.includes(".")) {
    return { error: "Escribí un email válido, por ejemplo: maria@gmail.com" };
  }

  const name = cleanText(formData.get("name"), 60) ?? email.split("@")[0];
  const next = safeNext(cleanText(formData.get("next"), 300));

  const user = await prisma.user.upsert({
    where: { email },
    update: { lastLoginAt: new Date() },
    create: {
      email,
      name,
      provider: "demo",
      providerId: email,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
      lastLoginAt: new Date(),
    },
  });

  await createSession(user.id);
  redirect(next);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

/** Registro con email y contraseña. */
export async function registerWithEmail(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = cleanText(formData.get("email"), 120)?.toLowerCase() ?? null;
  const name = cleanText(formData.get("name"), 60);
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = safeNext(cleanText(formData.get("next"), 300));

  if (!emailValido(email)) {
    return { error: "Escribí un email válido, por ejemplo: maria@gmail.com" };
  }
  if (!name) {
    return { error: "Escribí tu nombre y apellido." };
  }
  if (password.length < 8) {
    return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  }
  if (password.length > 72) {
    return { error: "La contraseña es demasiado larga." };
  }
  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error:
        "Ya existe una cuenta con ese email. Iniciá sesión o usá Google/Facebook si te registraste así.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      provider: "email",
      providerId: email,
      passwordHash,
      image: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
      lastLoginAt: new Date(),
    },
  });

  await createSession(user.id);
  redirect(next);
}

/** Inicio de sesión con email y contraseña. */
export async function loginWithEmail(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = cleanText(formData.get("email"), 120)?.toLowerCase() ?? null;
  const password = String(formData.get("password") ?? "");
  const next = safeNext(cleanText(formData.get("next"), 300));

  if (!emailValido(email)) {
    return { error: "Escribí un email válido." };
  }
  if (!password) {
    return { error: "Escribí tu contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return {
      error:
        "Email o contraseña incorrectos. Si te registraste con Google o Facebook, usá ese botón.",
    };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return {
      error:
        "Email o contraseña incorrectos. Si te registraste con Google o Facebook, usá ese botón.",
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(user.id);
  redirect(next);
}

/** Paso 1: guardamos el teléfono y enviamos el código. */
export async function startPhoneVerification(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión." };

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) {
    return { error: "Revisá el número. Ejemplo: 11 1234 5678 o 0341 555 1234." };
  }

  const code = generatePhoneCode();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone,
      phoneCode: code,
      phoneCodeExp: new Date(Date.now() + 10 * 60 * 1000),
      phoneVerified: false,
    },
  });
  const enviado = await sendVerificationCode(phone, code);
  revalidatePath("/perfil");

  if (!enviado.ok && hasVerificationProvider()) {
    return {
      error:
        "No pudimos enviar el código por WhatsApp/SMS. Revisá la configuración del proveedor o probá de nuevo en un rato.",
    };
  }

  // Sin proveedor (desarrollo/local) mostramos el código en pantalla para poder probar.
  const sinProveedor = !hasVerificationProvider();
  return {
    ok: sinProveedor
      ? "Código generado (modo prueba, sin proveedor configurado). Escribilo acá abajo."
      : "Te enviamos un código de 6 números por WhatsApp/SMS. Escribilo acá abajo.",
    info: sinProveedor ? `Modo prueba: tu código es ${code}` : undefined,
  };
}

/** Paso 2: confirmamos el código. */
export async function confirmPhoneCode(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión." };

  const code = cleanText(formData.get("code"), 10)?.replace(/\D/g, "");
  if (!code) return { error: "Escribí el código de 6 números." };

  if (!user.phoneCode || !user.phoneCodeExp || user.phoneCodeExp < new Date()) {
    return { error: "El código venció. Pedí uno nuevo." };
  }
  if (code !== user.phoneCode) {
    return { error: "El código no es correcto. Fijate y probá de nuevo." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { phoneVerified: true, phoneCode: null, phoneCodeExp: null },
  });
  revalidatePath("/perfil");
  return { ok: "¡Listo! Tu teléfono quedó verificado." };
}

/** Datos de perfil: nombre, foto y datos del auto. */
export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión." };

  const name = cleanText(formData.get("name"), 60);
  if (!name) return { error: "Escribí tu nombre." };

  const image = cleanImageUrl(formData.get("image")) ?? user.image;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      image,
      carModel: cleanText(formData.get("carModel"), 60),
      carColor: cleanText(formData.get("carColor"), 30),
      carPlate: cleanText(formData.get("carPlate"), 15),
    },
  });

  revalidatePath("/perfil");
  revalidatePath("/mis-viajes");
  return { ok: "Guardamos tus datos." };
}
