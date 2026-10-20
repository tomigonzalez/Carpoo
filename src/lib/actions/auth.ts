"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/session";
import { isDemoMode, sendVerificationCode } from "@/lib/notify";
import { cleanImageUrl, cleanText, generatePhoneCode, normalizePhone } from "@/lib/validate";
import { safeNext, type ActionState } from "@/lib/action-state";

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
  await sendVerificationCode(phone, code);
  revalidatePath("/perfil");

  return {
    ok: "Te enviamos un código de 6 números. Escribilo acá abajo.",
    info: isDemoMode() ? `Modo prueba: tu código es ${code}` : undefined,
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
