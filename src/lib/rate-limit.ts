import { headers } from "next/headers";

/**
 * Freno de intentos para acciones sensibles (login, registro, códigos).
 *
 * Es un limitador en memoria: alcanza para el demo local y para una instancia.
 * En un deploy serverless conviene cambiarlo por un store compartido (Redis,
 * Upstash, etc.) porque cada instancia tendría su propio contador.
 */

type Entrada = { cantidad: number; hasta: number };
const intentos = new Map<string, Entrada>();

/** IP de la request detrás de Vercel/proxy, con fallback para desarrollo. */
export async function ipDeLaRequest(): Promise<string> {
  const cabeceras = await headers();
  const reenviada = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || cabeceras.get("x-real-ip")?.trim() || "local";
}

/** Devuelve true si la acción entra dentro del límite y registra el intento. */
export function dentroDelLimite(clave: string, maximo: number, ventanaMs: number): boolean {
  const ahora = Date.now();

  // Limpieza barata para que el Map no crezca sin límite.
  if (intentos.size > 5000) {
    for (const [claveGuardada, entrada] of intentos) {
      if (entrada.hasta <= ahora) intentos.delete(claveGuardada);
    }
  }

  const entrada = intentos.get(clave);
  if (!entrada || entrada.hasta <= ahora) {
    intentos.set(clave, { cantidad: 1, hasta: ahora + ventanaMs });
    return true;
  }
  if (entrada.cantidad >= maximo) return false;
  entrada.cantidad += 1;
  return true;
}
