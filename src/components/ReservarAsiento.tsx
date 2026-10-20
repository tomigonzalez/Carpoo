"use client";

import { useActionState } from "react";
import { reserveSeat } from "@/lib/actions/reservations";
import { emptyActionState } from "@/lib/action-state";
import { Alerta, BotonWhatsApp } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";

/** Botón de reservar asiento + el paso siguiente: abrir el chat de WhatsApp. */
export function ReservarAsiento({
  tripId,
  driverName,
  driverPhone,
  mensajeWhatsApp,
}: {
  tripId: string;
  driverName: string;
  driverPhone: string | null;
  mensajeWhatsApp: string;
}) {
  const [estado, accion] = useActionState(reserveSeat, emptyActionState);

  if (estado.ok) {
    return (
      <div className="tarjeta" style={{ borderColor: "var(--verde)" }}>
        <Alerta tipo="ok">{estado.ok}</Alerta>
        <p style={{ marginTop: 0 }}>
          Ahora coordiná con <strong>{driverName}</strong> el pago y el punto de encuentro:
        </p>
        {driverPhone ? (
          <BotonWhatsApp telefono={driverPhone} mensaje={mensajeWhatsApp} />
        ) : (
          <Alerta tipo="info">
            El conductor todavía no cargó su teléfono. Vas a poder escribirle desde “Mis reservas”.
          </Alerta>
        )}
      </div>
    );
  }

  return (
    <form action={accion} className="tarjeta">
      <input type="hidden" name="tripId" value={tripId} />
      {estado.error ? <Alerta tipo="error">{estado.error}</Alerta> : null}
      <p style={{ marginTop: 0, marginBottom: 12, color: "var(--texto-suave)" }}>
        Al reservar se descuenta 1 asiento y le avisamos al conductor con tus datos.
      </p>
      <BotonEnviar variante="primario" enviando="Reservando…">
        ✅ Reservar asiento
      </BotonEnviar>
    </form>
  );
}
