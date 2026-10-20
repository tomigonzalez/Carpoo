"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/**
 * Botón que se bloquea y avisa "Enviando…" mientras el formulario está en curso.
 * Evita el doble toque típico en el celular.
 */
export function BotonEnviar({
  children,
  variante = "primario",
  enviando = "Enviando…",
  className = "",
}: {
  children: ReactNode;
  variante?: "primario" | "secundario" | "verde" | "peligro";
  enviando?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn btn-${variante} ${className}`}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? enviando : children}
    </button>
  );
}
