/**
 * Envío de códigos de verificación por SMS o WhatsApp (Twilio).
 *
 * - Sin proveedor configurado y con `DEMO_LOGIN="true"`: el código se muestra
 *   en pantalla para poder probar en local. NUNCA se escribe en los logs.
 * - Con Twilio configurado: se envía de verdad. Si `TWILIO_FROM` (o
 *   `TWILIO_WHATSAPP_FROM`) empieza con `whatsapp:`, el mensaje va por
 *   WhatsApp; si no, por SMS.
 */

/** El acceso de prueba es opt-in: si falta la variable, queda apagado. */
export const isDemoMode = () => process.env.DEMO_LOGIN === "true";

function twilioConfig() {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  // Para WhatsApp se puede usar TWILIO_WHATSAPP_FROM o TWILIO_FROM con prefijo:
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
  // No loguear el teléfono ni el código: los logs de Vercel son accesibles
  // para todo el equipo y pueden quedar retenidos.
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
      // Sin el cuerpo ni el mensaje de error: pueden incluir datos del proveedor.
      console.error("[Carpoo] Twilio rechazó el envío. Estado:", res.status);
      return { ok: false, error: "PROVIDER_ERROR" };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "[Carpoo] No se pudo enviar el código:",
      error instanceof Error ? error.name : "desconocido",
    );
    return { ok: false, error: "NETWORK_ERROR" };
  }
}
