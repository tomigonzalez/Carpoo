/**
 * Envío de códigos de verificación.
 *
 * En este MVP el código se muestra en pantalla cuando DEMO_LOGIN está activo
 * (para poder probar sin costos) y siempre queda registrado en la consola del
 * servidor. Para producción alcanza con conectar acá Twilio o la API de
 * WhatsApp Business (ver README, sección "Verificación por SMS/WhatsApp").
 */

export const isDemoMode = () => process.env.DEMO_LOGIN !== "false";

export async function sendVerificationCode(phone: string, code: string): Promise<void> {
  console.info(`[Carpoo] Código de verificación para ${phone}: ${code}`);

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return; // Sin proveedor configurado: solo consola.

  const body = new URLSearchParams({
    To: phone,
    From: from,
    Body: `Carpoo: tu código para verificar el teléfono es ${code}. Vence en 10 minutos.`,
  });

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  }).catch((error) => {
    console.error("[Carpoo] No se pudo enviar el SMS:", error);
  });
}
