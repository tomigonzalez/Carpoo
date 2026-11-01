"use client";

import { useEffect, useState } from "react";

type Cupos = { seatsTotal: number; seatsTaken: number; free: number; status: string };

/**
 * Muestra los asientos libres y los actualiza solo (cada 7 segundos).
 * Así el pasajero ve el cupo real, sin recargar la página.
 */
export function CuposEnVivo({ tripId, inicial }: { tripId: string; inicial: Cupos }) {
  const [cupos, setCupos] = useState<Cupos>(inicial);
  const [actualizado, setActualizado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function consultar() {
      try {
        const res = await fetch(`/api/viajes/${tripId}/cupos`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Cupos;
        if (cancelado) return;
        setCupos((previo) =>
          previo.seatsTaken === data.seatsTaken && previo.status === data.status ? previo : data,
        );
        setActualizado(true);
      } catch {
        // Sin conexión: seguimos mostrando el último dato conocido.
      }
    }

    consultar();
    const timer = setInterval(consultar, 7000);
    return () => {
      cancelado = true;
      clearInterval(timer);
    };
  }, [tripId]);

  const lleno = cupos.status === "FULL" || cupos.free === 0;
  const cancelado = cupos.status === "CANCELLED";
  const ocupacion = Math.min(100, Math.round((cupos.seatsTaken / Math.max(cupos.seatsTotal, 1)) * 100));

  return (
    <div>
      <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>
        {cancelado ? (
          <span style={{ color: "var(--rojo)" }}>Viaje cancelado</span>
        ) : lleno ? (
          <span style={{ color: "var(--amarillo)" }}>Sin asientos libres</span>
        ) : (
          <span style={{ color: "var(--verde)" }}>
            {cupos.free} {cupos.free === 1 ? "asiento libre" : "asientos libres"}
          </span>
        )}
      </p>
      <p style={{ margin: "2px 0 0", color: "var(--texto-suave)", fontSize: "0.9rem" }}>
        {cupos.seatsTaken} de {cupos.seatsTotal} ocupados
        {actualizado ? " · actualizado en vivo" : ""}
      </p>
      <div className="cupos-barra" aria-hidden="true">
        <span style={{ width: `${ocupacion}%` }} />
      </div>
    </div>
  );
}
