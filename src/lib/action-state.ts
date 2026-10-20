/** Estado que devuelven los formularios con useActionState. */
export type ActionState = {
  error?: string;
  ok?: string;
  /** Se usa en la verificación de teléfono para mostrar el código en modo prueba. */
  info?: string;
};

export const emptyActionState: ActionState = {};

/** Evita redirecciones abiertas: solo aceptamos rutas internas. */
export function safeNext(next: string | null | undefined): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}
