/** Validaciones y limpieza de datos que carga el usuario. */

/**
 * Deja solo los dígitos y normaliza teléfonos argentinos a formato WhatsApp.
 *   "11 1234-5678"        -> +5491112345678
 *   "011 15 1234 5678"    -> +5491112345678
 *   "+54 9 341 555 1234"  -> +5493415551234
 */
export function normalizePhone(input: string): string | null {
  let digits = (input || "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("54")) {
    digits = digits.slice(2);
    if (digits.startsWith("9")) digits = digits.slice(1);
  }
  if (digits.startsWith("0")) digits = digits.slice(1);
  // El "15" del celular va después del código de área (2 a 4 dígitos).
  if (digits.length >= 2) {
    const areaLength = digits.length >= 11 ? 4 : 2;
    const area = digits.slice(0, areaLength);
    const rest = digits.slice(areaLength);
    if (rest.startsWith("15")) digits = area + rest.slice(2);
  }

  if (digits.length < 8 || digits.length > 12) return null;
  return `+549${digits}`;
}

/** Link para abrir el chat de WhatsApp con un mensaje ya escrito. */
export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** Recorta, colapsa espacios y limita el largo. Devuelve null si queda vacío. */
export function cleanText(input: unknown, maxLength = 200): string | null {
  if (typeof input !== "string") return null;
  const clean = input.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  return clean.slice(0, maxLength);
}

/** Números enteros dentro de un rango. */
export function cleanInt(input: unknown, min: number, max: number): number | null {
  const value = typeof input === "number" ? input : Number.parseInt(String(input ?? ""), 10);
  if (!Number.isFinite(value)) return null;
  const rounded = Math.trunc(value);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

/** Código de 6 dígitos para verificar el teléfono. */
export function generatePhoneCode(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

/** Normaliza links de fotos: solo aceptamos http/https. */
export function cleanImageUrl(input: unknown): string | null {
  const value = cleanText(input, 500);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Solo los dígitos de un teléfono (para comparar). */
export function phoneDigits(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

/** Muestra el teléfono de forma legible: +54 9 11 1234 5678 */
export function prettyPhone(phone: string | null | undefined): string {
  const digits = phoneDigits(phone);
  if (!digits) return "Sin teléfono";
  if (digits.startsWith("549") && digits.length >= 11) {
    return `+54 9 ${digits.slice(3, 5)} ${digits.slice(5, 9)} ${digits.slice(9)}`;
  }
  return `+${digits}`;
}
