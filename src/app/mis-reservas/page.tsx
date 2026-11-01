import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getReservationsAsPassenger, getReviewsByAuthor } from "@/lib/queries";
import { cancelMyReservation, confirmMyAttendance } from "@/lib/actions/reservations";
import { formatRelativeDay, formatTripDate, isPast } from "@/lib/format";
import { mensajeReserva } from "@/lib/messages";
import { prettyPhone } from "@/lib/validate";
import {
  Alerta,
  Avatar,
  BotonWhatsApp,
  EnlaceBoton,
  Estado,
  TituloPagina,
  Vacio,
} from "@/components/ui";
import { BotonEnviar } from "@/components/BotonEnviar";
import { FormularioResena } from "@/components/FormularioResena";

export const metadata = { title: "Mis reservas · Carpoo" };

export default async function MisReservasPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/ingresar?volver=/mis-reservas");

  const [reservas, misResenas] = await Promise.all([
    getReservationsAsPassenger(user.id),
    getReviewsByAuthor(user.id),
  ]);

  return (
    <>
      <TituloPagina
        titulo="Mis reservas"
        subtitulo="Tus asientos reservados y el contacto del conductor para coordinar."
      />

      {reservas.length === 0 ? (
        <Vacio
          titulo="Todavía no reservaste ningún asiento"
          texto="Buscá un viaje que te sirva y reservá en un toque."
        >
          <EnlaceBoton href="/buscar">Buscar asiento</EnlaceBoton>
        </Vacio>
      ) : (
        reservas.map((reserva) => {
          const trip = reserva.trip;
          const yaSalio = isPast(trip.dateTime);
          const reservaCanceladaPorMi = reserva.status === "CANCELLED";
          const canceladaPorConductor = trip.status === "CANCELLED";
          const yaCalifique = misResenas.some(
            (r) => r.tripId === trip.id && r.targetId === trip.driver.id,
          );

          return (
            <section key={reserva.id} className="tarjeta">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, color: "var(--texto-suave)", fontWeight: 700 }}>
                    {formatRelativeDay(trip.dateTime)}
                  </p>
                  <h2 style={{ margin: "2px 0 0", fontSize: "1.2rem" }}>
                    {trip.origin} → {trip.destination}
                  </h2>
                  <p style={{ margin: "2px 0 0", color: "var(--texto-suave)" }}>
                    {formatTripDate(trip.dateTime)} · Aporte: {trip.contribution || "A convenir"}
                  </p>
                </div>
                {canceladaPorConductor ? (
                  <Estado tipo="rojo">Cancelado por el conductor</Estado>
                ) : reservaCanceladaPorMi ? (
                  <Estado tipo="gris">Cancelaste tu reserva</Estado>
                ) : reserva.status === "ATTENDED" ? (
                  <Estado tipo="ok">Viajaste</Estado>
                ) : reserva.status === "NO_SHOW" ? (
                  <Estado tipo="rojo">El conductor marcó que no fuiste</Estado>
                ) : (
                  <Estado tipo="ok">Reserva confirmada</Estado>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px dashed var(--borde)",
                }}
              >
                <Avatar src={trip.driver.image} nombre={trip.driver.name} chico />
                <div>
                  <strong style={{ display: "block" }}>
                    <Link href={`/usuarios/${trip.driver.id}`} style={{ color: "inherit" }}>
                      {trip.driver.name}
                    </Link>
                  </strong>
                  <span style={{ color: "var(--texto-suave)", fontSize: "0.9rem" }}>
                    {[trip.driver.carColor, trip.driver.carModel].filter(Boolean).join(" ")}
                    {trip.driver.carPlate ? ` · ${trip.driver.carPlate}` : ""}
                    {trip.driver.phone ? ` · ${prettyPhone(trip.driver.phone)}` : ""}
                  </span>
                </div>
              </div>

              {!reservaCanceladaPorMi && !canceladaPorConductor ? (
                <div style={{ marginTop: 14 }}>
                  {trip.driver.phone ? (
                    <BotonWhatsApp
                      telefono={trip.driver.phone}
                      mensaje={mensajeReserva({ passengerName: user.name, trip })}
                      texto={`Escribirle a ${trip.driver.name.split(" ")[0]}`}
                    />
                  ) : (
                    <Alerta tipo="info">
                      El conductor todavía no cargó su teléfono. Probá más tarde.
                    </Alerta>
                  )}

                  <div className="fila-botones" style={{ marginTop: 10 }}>
                    {reserva.status === "CONFIRMED" && !yaSalio ? (
                      <form action={cancelMyReservation}>
                        <input type="hidden" name="reservationId" value={reserva.id} />
                        <BotonEnviar variante="peligro" enviando="Cancelando…">
                          Cancelar mi reserva
                        </BotonEnviar>
                      </form>
                    ) : null}

                    {reserva.status === "CONFIRMED" && yaSalio ? (
                      <form action={confirmMyAttendance}>
                        <input type="hidden" name="reservationId" value={reserva.id} />
                        <BotonEnviar variante="secundario" enviando="Guardando…">
                          Sí, viajé
                        </BotonEnviar>
                      </form>
                    ) : null}

                    <EnlaceBoton href={`/viajes/${trip.id}`} variante="secundario">
                      Ver el viaje
                    </EnlaceBoton>
                  </div>

                  {reserva.status === "CONFIRMED" && !yaSalio ? (
                    <p className="ayuda" style={{ marginTop: 10 }}>
                      Si no podés viajar, cancelá tu reserva así otra persona puede usar el asiento.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {yaSalio && !canceladaPorConductor && !reservaCanceladaPorMi ? (
                <div style={{ marginTop: 14, borderTop: "1px dashed var(--borde)", paddingTop: 12 }}>
                  {yaCalifique ? (
                    <Alerta tipo="ok">Ya calificaste a este conductor. ¡Gracias!</Alerta>
                  ) : (
                    <FormularioResena
                      tripId={trip.id}
                      targetId={trip.driver.id}
                      nombre={trip.driver.name.split(" ")[0]}
                    />
                  )}
                </div>
              ) : null}
            </section>
          );
        })
      )}

      <p style={{ marginTop: 18 }}>
        <EnlaceBoton href="/mis-viajes" variante="secundario">
          Ver mis viajes como conductor
        </EnlaceBoton>
      </p>
    </>
  );
}
