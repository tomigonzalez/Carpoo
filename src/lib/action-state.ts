/** Estado que devuelven los formularios con useActionState. */
export type ActionState = {
  error?: string;
  ok?: string;
  /** Se usa en la verificación de teléfono para mostrar el código en modo prueba. */
  info?: string;
};

export const emptyActionState: ActionState = {};

/**
 * Evita redirecciones abiertas: solo aceptamos rutas internas del mismo origen.
 * `//evil.com` y `/\evil.com` son externos para WHATWG URL, por eso se valida
 * con `new URL` y se compara el origin (y se rechazan los backslashes).
 */
export function safeNext(
  next: string | null | undefined,
  baseUrl = process.env.APP_URL?.trim() || "http://localhost:3000",
): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.includes("\\") || /%5c/i.test(next)) return "/";

  try {
    const base = new URL(baseUrl);
    const destino = new URL(next, base);
    if (destino.origin !== base.origin) return "/";
    return `${destino.pathname}${destino.search}${destino.hash}`;
  } catch {
    return "/";
  }
}
