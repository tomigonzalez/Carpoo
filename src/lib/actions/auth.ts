"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/session";
import { hasVerificationProvider, isDemoMode, sendVerificationCode } from "@/lib/notify";
import { cleanImageUrl, cleanText, normalizePhone } from "@/lib/validate";
import { generatePhoneCode, hashPhoneCode, verifyPhoneCode } from "@/lib/phone-code";
import { dentroDelLimite, ipDeLaRequest } from "@/lib/rate-limit";
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

  const ip = await ipDeLaRequest();
  if (!dentroDelLimite(`demo:${ip}`, 10, 60_000)) {
    return { error: "Demasiados intentos. Esperá un minuto y probá de nuevo." };
  }

  const email = cleanText(formData.get("email"), 120)?.toLowerCase() ?? null;
  if (!emailValido(email)) {
    return { error: "Escribí un email válido, por ejemplo: maria@gmail.com" };
  }

  const name = cleanText(formData.get("name"), 60) ?? email.split("@")[0];
  const next = safeNext(cleanText(formData.get("next"), 300));

  // Nunca dejamos que el acceso de prueba pise una cuenta real (email,
  // Google o Facebook): sería una toma de cuenta.
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente && existente.provider !== "demo") {
    return {
      error:
        "Ese email ya tiene una cuenta. Ingresá con tu contraseña o con Google/Facebook.",
    };
  }

  const user = existente
    ? await prisma.user.update({
        where: { id: existente.id },
        data: { lastLoginAt: new Date() },
      })
    : await prisma.user.create({
        data: {
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
  const ip = await ipDeLaRequest();
  if (!dentroDelLimite(`registro:${ip}`, 5, 10 * 60_000)) {
    return { error: "Demasiados registros desde esta conexión. Probá en unos minutos." };
  }

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
  const ip = await ipDeLaRequest();
  if (!dentroDelLimite(`login:${ip}`, 10, 15 * 60_000)) {
    return { error: "Demasiados intentos de ingreso. Probá en unos minutos." };
  }

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

  const ip = await ipDeLaRequest();
  if (!dentroDelLimite(`codigo:${ip}`, 10, 60 * 60_000)) {
    return { error: "Pediste muchos códigos. Probá de nuevo en una hora." };
  }

  // Sin proveedor y sin modo demo no se puede probar posesión del teléfono:
  // mostrar el código en producción permitiría verificar cualquier número.
  const modoPrueba = isDemoMode() && !hasVerificationProvider();
  if (!modoPrueba && !hasVerificationProvider()) {
    return { error: "La verificación por teléfono no está disponible en este momento." };
  }

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) {
    return { error: "Revisá el número. Ejemplo: 11 1234 5678 o 0341 555 1234." };
  }

  if (user.phoneCodeSentAt && Date.now() - user.phoneCodeSentAt.getTime() < 60_000) {
    return { error: "Esperá un minuto antes de pedir otro código." };
  }

  const code = generatePhoneCode();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      phone,
      phoneCode: hashPhoneCode(code),
      phoneCodeExp: new Date(Date.now() + 10 * 60 * 1000),
      phoneCodeAttempts: 0,
      phoneCodeSentAt: new Date(),
      phoneVerified: false,
    },
  });
  const enviado = await sendVerificationCode(phone, code);
  revalidatePath("/perfil");

  if (!enviado.ok && hasVerificationProvider()) {
    // Si el envío falló, el código queda sin validez para no dejar una puerta abierta.
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneCode: null, phoneCodeExp: null },
    });
    return {
      error:
        "No pudimos enviar el código por WhatsApp/SMS. Revisá la configuración del proveedor o probá de nuevo en un rato.",
    };
  }

  return {
    ok: modoPrueba
      ? "Código generado (modo prueba, sin proveedor configurado). Escribilo acá abajo."
      : "Te enviamos un código de 6 números por WhatsApp/SMS. Escribilo acá abajo.",
    info: modoPrueba ? `Modo prueba: tu código es ${code}` : undefined,
  };
}

/** Paso 2: confirmamos el código (máximo 5 intentos por código). */
export async function confirmPhoneCode(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión." };

  if (!dentroDelLimite(`confirmar:${user.id}`, 5, 10 * 60_000)) {
    return { error: "Demasiados intentos. Pedí un código nuevo." };
  }

  const code = cleanText(formData.get("code"), 10)?.replace(/\D/g, "");
  if (!code || code.length !== 6) return { error: "Escribí el código de 6 números." };

  if (!user.phoneCode || !user.phoneCodeExp || user.phoneCodeExp < new Date()) {
    return { error: "El código venció. Pedí uno nuevo." };
  }
  if (user.phoneCodeAttempts >= 5) {
    return { error: "Agotaste los intentos. Pedí un código nuevo." };
  }
  if (!verifyPhoneCode(user.phoneCode, code)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneCodeAttempts: { increment: 1 } },
    });
    return { error: "El código no es correcto. Fijate y probá de nuevo." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      phoneVerified: true,
      phoneCode: null,
      phoneCodeExp: null,
      phoneCodeAttempts: 0,
      phoneCodeSentAt: null,
    },
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
