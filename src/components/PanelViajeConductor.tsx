import Link from "next/link";
import { setTripStatus } from "@/lib/actions/trips";
import { acceptRequest, markPassengerStatus, rejectRequest } from "@/lib/actions/reservations";
import { formatRelativeDay, formatTripDate, isPast } from "@/lib/format";
import { mensajeConductor } from "@/lib/messages";
import { prettyPhone } from "@/lib/validate";
import { Alerta, Avatar, BotonWhatsApp, Estado } from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";
import { FormularioEditarViaje } from "@/components/FormularioEditarViaje";

type Trip = {
  id: string;
  origin: string;
  destination: string;
  dateTime: Date;
  seatsTotal: number;
  seatsTaken: number;
  status: string;
  contribution: string | null;
  notes: string | null;
  reservations: Array<{
    id: string;
    status: string;
    passenger: { id: string; name: string; image: string | null; phone: string | null };
  }>;
};

/** Un viaje del conductor: solicitudes, pasajeros anotados y botones de estado. */
export function PanelViajeConductor({
  trip,
  nombreConductor,
}: {
  trip: Trip;
  nombreConductor: string;
}) {
  const libres = Math.max(trip.seatsTotal - trip.seatsTaken, 0);
  const yaSalio = isPast(trip.dateTime);
  const pendientes = trip.reservations.filter((r) => r.status === "PENDING");
  const activos = trip.reservations.filter((r) => r.status === "CONFIRMED");

  return (
    <section className="tarjeta">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, color: "var(--texto-suave)", fontWeight: 700 }}>
            {formatRelativeDay(trip.dateTime)}
          </p>
          <h2 style={{ margin: "2px 0 0", fontSize: "1.25rem" }}>
            {trip.origin} → {trip.destination}
          </h2>
          <p style={{ margin: "2px 0 0", color: "var(--texto-suave)" }}>{formatTripDate(trip.dateTime)}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          {trip.status === "CANCELLED" ? (
            <Estado tipo="rojo">Cancelado</Estado>
          ) : trip.status === "DONE" ? (
            <Estado tipo="gris">Realizado</Estado>
          ) : libres === 0 ? (
            <Estado tipo="aviso">Completo</Estado>
          ) : (
            <Estado tipo="ok">
              {libres} {libres === 1 ? "lugar libre" : "lugares libres"}
            </Estado>
          )}
          <span className="ayuda" style={{ margin: 0 }}>
            {trip.seatsTaken} de {trip.seatsTotal} ocupados
          </span>
        </div>
      </div>

      <p style={{ margin: "10px 0 0" }}>
        <Link href={`/viajes/${trip.id}`}>Ver la publicación</Link>
        {trip.contribution ? ` · Aporte: ${trip.contribution}` : ""}
      </p>

      {pendientes.length > 0 ? (
        <>
          <h3 style={{ marginTop: 16, fontSize: "1.05rem" }}>Solicitudes pendientes</h3>
          <p style={{ margin: "4px 0 10px", color: "var(--texto-suave)" }}>
            Aceptá para que ocupe un asiento. Al rechazar no se descuenta ningún cupo.
          </p>
          <ul className="lista-limpia" style={{ display: "grid", gap: 12 }}>
            {pendientes.map((reserva) => (
              <li key={reserva.id} style={{ border: "1px solid var(--borde)", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Avatar src={reserva.passenger.image} nombre={reserva.passenger.name} chico />
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <strong style={{ display: "block" }}>{reserva.passenger.name}</strong>
                    <span style={{ color: "var(--texto-suave)", fontSize: "0.9rem" }}>
                      {prettyPhone(reserva.passenger.phone)}
                    </span>
                  </div>
                </div>
                <div className="fila-botones" style={{ marginTop: 10 }}>
                  <form action={acceptRequest}>
                    <input type="hidden" name="reservationId" value={reserva.id} />
                    <BotonEnviar variante="verde" enviando="Aceptando…">
                      Aceptar
                    </BotonEnviar>
                  </form>
                  <form action={rejectRequest}>
                    <input type="hidden" name="reservationId" value={reserva.id} />
                    <BotonEnviar variante="peligro" enviando="Rechazando…">
                      Rechazar
                    </BotonEnviar>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h3 style={{ marginTop: 18, fontSize: "1.05rem" }}>Pasajeros anotados</h3>
      {activos.length === 0 && trip.reservations.filter((r) => r.status !== "CANCELLED" && r.status !== "PENDING").length === 0 && pendientes.length === 0 ? (
        <p style={{ color: "var(--texto-suave)", margin: "6px 0" }}>
          Todavía nadie solicitó asiento. Compartí el viaje con tu gente.
        </p>
      ) : null}

      <ul className="lista-limpia" style={{ display: "grid", gap: 14 }}>
        {trip.reservations
          .filter((r) => r.status !== "PENDING")
          .map((reserva) => (
          <li key={reserva.id} style={{ borderTop: "1px solid var(--borde)", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Avatar src={reserva.passenger.image} nombre={reserva.passenger.name} chico />
              <div style={{ flex: 1, minWidth: 140 }}>
                <strong style={{ display: "block" }}>{reserva.passenger.name}</strong>
                <span style={{ color: "var(--texto-suave)", fontSize: "0.9rem" }}>
                  {prettyPhone(reserva.passenger.phone)}
                </span>
              </div>
              {reserva.status === "ATTENDED" ? <Estado tipo="ok">Viajó</Estado> : null}
              {reserva.status === "NO_SHOW" ? <Estado tipo="rojo">No vino</Estado> : null}
              {reserva.status === "CANCELLED" ? <Estado tipo="gris">Canceló</Estado> : null}
            </div>

            {reserva.status !== "CANCELLED" ? (
              <div style={{ marginTop: 10 }}>
                {reserva.passenger.phone ? (
                  <BotonWhatsApp
                    telefono={reserva.passenger.phone}
                    mensaje={mensajeConductor({
                      driverName: nombreConductor,
                      passengerName: reserva.passenger.name,
                      trip,
                    })}
                    texto={`💬 Avisarle a ${reserva.passenger.name.split(" ")[0]}`}
                  />
                ) : null}

                {yaSalio ? (
                  <div className="fila-botones" style={{ marginTop: 10 }}>
                    <form action={markPassengerStatus}>
                      <input type="hidden" name="reservationId" value={reserva.id} />
                      <input type="hidden" name="status" value="ATTENDED" />
                      <BotonEnviar variante="secundario" enviando="Guardando…">
                        ✅ Viajó
                      </BotonEnviar>
                    </form>
                    <form action={markPassengerStatus}>
                      <input type="hidden" name="reservationId" value={reserva.id} />
                      <input type="hidden" name="status" value="NO_SHOW" />
                      <BotonEnviar variante="peligro" enviando="Guardando…">
                        🚫 No vino
                      </BotonEnviar>
                    </form>
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {yaSalio && activos.length > 0 ? (
        <Alerta tipo="info">
          ¿Alguien reservó y no apareció? Marcá “No vino”: eso baja su presentismo y ayuda a los
          demás conductores.
        </Alerta>
      ) : null}

      <div className="fila-botones" style={{ marginTop: 14 }}>
        {trip.status === "ACTIVE" && libres > 0 ? (
          <form action={setTripStatus}>
            <input type="hidden" name="tripId" value={trip.id} />
            <input type="hidden" name="status" value="FULL" />
            <BotonEnviar variante="secundario" enviando="Guardando…">
              Marcar como completo
            </BotonEnviar>
          </form>
        ) : null}

        {trip.status === "FULL" ? (
          <form action={setTripStatus}>
            <input type="hidden" name="tripId" value={trip.id} />
            <input type="hidden" name="status" value="ACTIVE" />
            <BotonEnviar variante="secundario" enviando="Guardando…">
              Vuelvo a habilitar lugares
            </BotonEnviar>
          </form>
        ) : null}

        {yaSalio && trip.status !== "DONE" && trip.status !== "CANCELLED" ? (
          <form action={setTripStatus}>
            <input type="hidden" name="tripId" value={trip.id} />
            <input type="hidden" name="status" value="DONE" />
            <BotonEnviar variante="verde" enviando="Guardando…">
              Marcar como realizado
            </BotonEnviar>
          </form>
        ) : null}

        {trip.status !== "CANCELLED" && !yaSalio ? (
          <form action={setTripStatus}>
            <input type="hidden" name="tripId" value={trip.id} />
            <input type="hidden" name="status" value="CANCELLED" />
            <BotonEnviar variante="peligro" enviando="Cancelando…">
              Cancelar el viaje
            </BotonEnviar>
          </form>
        ) : null}
      </div>

      {!yaSalio && trip.status !== "CANCELLED" ? (
        <FormularioEditarViaje
          tripId={trip.id}
          seatsTotal={trip.seatsTotal}
          seatsTaken={trip.seatsTaken}
          contribution={trip.contribution}
          notes={trip.notes}
        />
      ) : null}
    </section>
  );
}
