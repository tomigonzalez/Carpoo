/**
 * Envío de códigos de verificación por SMS o WhatsApp (Twilio).
 *
 * - Sin proveedor configurado: el código queda en la consola del servidor y la
 *   pantalla lo muestra como ayuda (modo prueba/local).
 * - Con Twilio configurado: se envía de verdad. Si `TWILIO_FROM` (o
 *   `TWILIO_WHATSAPP_FROM`) empieza con `whatsapp:`, el mensaje va por
 *   WhatsApp; si no, por SMS.
 */

export const isDemoMode = () => process.env.DEMO_LOGIN !== "false";

function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  // Para WhatsApp se puede usar TWILIO_WHATSAPP_FROM o un TWILIO_FROM con prefijo whatsapp:
  const from =
    process.env.TWILIO_WHATSAPP_FROM?.trim() || process.env.TWILIO_FROM?.trim();
  if (!sid || !token || !from) return null;
  return { sid, token, from };
}

export function hasVerificationProvider(): boolean {
  return twilioConfig() !== null;
}

function asWhatsApp(value: string): string {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendVerificationCode(
  phone: string,
  code: string,
): Promise<SendResult> {
  console.info(`[Carpoo] Código de verificación para ${phone}: ${code}`);

  const config = twilioConfig();
  if (!config) return { ok: false, error: "NO_PROVIDER" };

  const useWhatsApp = config.from.startsWith("whatsapp:");
  const to = useWhatsApp ? asWhatsApp(phone) : phone;
  const from = config.from;

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Carpoo: tu código para verificar el teléfono es ${code}. Vence en 10 minutos.`,
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${Buffer.from(`${config.sid}:${config.token}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[Carpoo] Twilio rechazó el envío:", res.status, detail);
      return { ok: false, error: "PROVIDER_ERROR" };
    }

    return { ok: true };
  } catch (error) {
    console.error("[Carpoo] No se pudo enviar el código:", error);
    return { ok: false, error: "NETWORK_ERROR" };
  }
}
