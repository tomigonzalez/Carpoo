import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/**
 * Códigos de verificación del teléfono.
 *
 * El código se genera con el PRNG criptográfico de Node (nunca `Math.random`) y
 * se guarda en la base **hasheado** con AUTH_SECRET: si se filtra la DB, no se
 * filtran los códigos vigentes. La comparación es de tiempo constante.
 */

function clave(): string {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 16) {
    throw new Error("Falta AUTH_SECRET en el archivo .env (usá una cadena larga y aleatoria).");
  }
  return secreto;
}

/** Código de 6 dígitos, incluyendo ceros a la izquierda. */
export function generatePhoneCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Guardamos `hmac:<hex>` en vez del código en claro. */
export function hashPhoneCode(code: string): string {
  return `hmac:${createHmac("sha256", clave()).update(`carpoo:otp:${code}`).digest("hex")}`;
}

/** Compara el código ingresado con el valor guardado sin filtrar por timing. */
export function verifyPhoneCode(guardado: string | null | undefined, code: string): boolean {
  if (!guardado) return false;
  const esperado = Buffer.from(hashPhoneCode(code));
  const recibido = Buffer.from(guardado);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}
