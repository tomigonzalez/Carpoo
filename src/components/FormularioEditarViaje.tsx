"use client";

import { useActionState } from "react";
import { updateTrip } from "@/lib/actions/trips";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

/** Cambiar asientos, aporte o aclaraciones de un viaje ya publicado. */
export function FormularioEditarViaje({
  tripId,
  seatsTotal,
  seatsTaken,
  contribution,
  notes,
}: {
  tripId: string;
  seatsTotal: number;
  seatsTaken: number;
  contribution: string | null;
  notes: string | null;
}) {
  const [estado, accion] = useActionState(updateTrip, emptyActionState);

  return (
    <details style={{ marginTop: 14 }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>
        Cambiar asientos o aclaraciones
      </summary>
      <form action={accion} style={{ marginTop: 12 }}>
        <input type="hidden" name="tripId" value={tripId} />
        {estado.error ? <Alerta tipo="error">{estado.error}</Alerta> : null}
        {estado.ok ? <Alerta tipo="ok">{estado.ok}</Alerta> : null}

        <label className="campo">
          <span className="etiqueta">Asientos ofrecidos</span>
          <input
            className="entrada"
            type="number"
            name="seats"
            min={seatsTaken || 1}
            max={8}
            defaultValue={seatsTotal}
          />
          <span className="ayuda">
            No podés ofrecer menos que los {seatsTaken} asientos ya reservados.
          </span>
        </label>

        <label className="campo">
          <span className="etiqueta">Aporte por persona</span>
          <input
            className="entrada"
            type="text"
            name="contribution"
            maxLength={60}
            defaultValue={contribution ?? ""}
            placeholder="A convenir"
          />
        </label>

        <label className="campo">
          <span className="etiqueta">Aclaraciones</span>
          <textarea className="entrada" name="notes" maxLength={300} defaultValue={notes ?? ""} />
        </label>

        <BotonEnviar variante="secundario" enviando="Guardando…">
          Guardar cambios
        </BotonEnviar>
      </form>
    </details>
  );
}
