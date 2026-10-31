"use client";

import { useActionState } from "react";
import { requestSeat } from "@/lib/actions/reservations";
import { emptyActionState } from "@/lib/action-state";
import { Alerta } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

/** Botón para solicitar asiento. El conductor debe aceptar antes de ocupar un lugar. */
export function ReservarAsiento({
  tripId,
}: {
  tripId: string;
  driverName?: string;
  driverPhone?: string | null;
  mensajeWhatsApp?: string;
}) {
  const [estado, accion] = useActionState(requestSeat, emptyActionState);

  if (estado.ok) {
    return (
      <div className="tarjeta">
        <Alerta tipo="ok">{estado.ok}</Alerta>
        <p style={{ margin: "8px 0 0", color: "var(--texto-suave)" }}>
          Cuando el conductor acepte la solicitud te va a aparecer el botón para escribirle por WhatsApp desde este viaje o desde «Mis reservas».
        </p>
      </div>
    );
  }

  return (
    <form action={accion} className="tarjeta">
      <input type="hidden" name="tripId" value={tripId} />
      {estado.error ? <Alerta tipo="error">{estado.error}</Alerta> : null}
      <p style={{ marginTop: 0, marginBottom: 12, color: "var(--texto-suave)" }}>
        El lugar no se descuenta hasta que el conductor acepte tu solicitud.
      </p>
      <BotonEnviar variante="primario" enviando="Enviando…" className="btn-bloque">
        Solicitar asiento
      </BotonEnviar>
    </form>
  );
}
