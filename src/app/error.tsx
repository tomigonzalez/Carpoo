"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="tarjeta" style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: "1.5rem" }}>Algo salió mal</h1>
      <p style={{ color: "var(--texto-suave)" }}>
        Probá de nuevo en unos segundos. Si sigue igual, cerrá y volvé a abrir la página.
      </p>
      <button type="button" className="btn btn-primario" onClick={() => reset()}>
        Reintentar
      </button>
      <p style={{ marginTop: 12, marginBottom: 0 }}>
        <Link href="/">Volver al inicio</Link>
      </p>
    </div>
  );
}
