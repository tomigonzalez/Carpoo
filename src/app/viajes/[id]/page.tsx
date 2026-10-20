import Link from "next/link";
import { notFound } from "next/navigation";
import { getTripDetail } from "@/lib/queries";
import { getCurrentUser, isProfileComplete, missingProfileItems } from "@/lib/session";
import { attendanceLabel, getStatsForUsers, ratingLabel } from "@/lib/stats";
import { formatRelativeDay, formatTripDate } from "@/lib/format";
import { mensajeReserva } from "@/lib/messages";
import { prettyPhone } from "@/lib/validate";
import {
  Alerta,
  Avatar,
  BotonWhatsApp,
  EnlaceBoton,
  Estado,
  Estrellas,
  TituloPagina,
  Verificado,
} from "@/components/ui";
import { CuposEnVivo } from "@/components/CuposEnVivo";
import { ReservarAsiento } from "@/components/ReservarAsiento";
import { FormularioResena } from "@/components/FormularioResena";

export const metadata = { title: "Detalle del viaje · Carpoo" };

export default async function ViajePage({ params }: PageProps<"/viajes/[id]">) {
  const { id } = await params;
  const [trip, user] = await Promise.all([getTripDetail(id), getCurrentUser()]);
  if (!trip) notFound();

  const stats = (await getStatsForUsers([trip.driver.id])).get(trip.driver.id);
  const ahora = new Date();
  const yaSalio = trip.dateTime.getTime() < ahora.getTime();
  const libres = Math.max(trip.seatsTotal - trip.seatsTaken, 0);
  const auto = [trip.driver.carColor, trip.driver.carModel].filter(Boolean).join(" ");

  const esConductor = user?.id === trip.driver.id;
  const miReserva = user ? trip.reservations.find((r) => r.passengerId === user.id) : undefined;
  const reservaActiva = miReserva?.status === "CONFIRMED";
  const pasajerosConfirmados = trip.reservations.filter((r) => r.status === "CONFIRMED");
  const puedeVerTelefono = Boolean(
    user && (esConductor || reservaActiva || miReserva?.status === "ATTENDED"),
  );

  const cancelado = trip.status === "CANCELLED";
  const completo = trip.status === "FULL" || libres === 0;

  // Reseñas que ya escribí en este viaje y con quién me falta calificar.
  const mias = user ? trip.reviews.filter((r) => r.authorId === user.id) : [];
  const participantes = esConductor
    ? pasajerosConfirmados.map((r) => ({ id: r.passenger.id, name: r.passenger.name }))
    : user && (reservaActiva || miReserva?.status === "ATTENDED")
      ? [{ id: trip.driver.id, name: trip.driver.name }]
      : [];
  const faltanCalificar =
    yaSalio && !cancelado
      ? participantes.filter((p) => p.id !== user?.id && !mias.some((m) => m.targetId === p.id))
      : [];

  return (
    <>
      <p style={{ marginTop: 0 }}>
        <Link href="/buscar">← Volver a la búsqueda</Link>
      </p>

      <div className="tarjeta">
        <TituloPagina
          titulo={`${trip.origin} → ${trip.destination}`}
          subtitulo={`${formatRelativeDay(trip.dateTime)} · ${formatTripDate(trip.dateTime)}`}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {cancelado ? (
              <Estado tipo="rojo">Viaje cancelado por el conductor</Estado>
            ) : trip.status === "DONE" ? (
              <Estado tipo="gris">Viaje realizado</Estado>
            ) : completo ? (
              <Estado tipo="aviso">Completo</Estado>
            ) : (
              <Estado tipo="ok">Disponible</Estado>
            )}
            {trip.status === "DONE" || (yaSalio && !cancelado) ? (
              <Estado tipo="gris">Ya salió el {formatRelativeDay(trip.dateTime).toLowerCase()}</Estado>
            ) : null}
          </div>
        </TituloPagina>

        <CuposEnVivo
          tripId={trip.id}
          inicial={{
            seatsTotal: trip.seatsTotal,
            seatsTaken: trip.seatsTaken,
            free: libres,
            status: trip.status,
          }}
        />
      </div>

      {/* --- Conductor --- */}
      <section className="tarjeta">
        <h2 className="tarjeta-titulo">Quién maneja</h2>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Avatar src={trip.driver.image} nombre={trip.driver.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href={`/usuarios/${trip.driver.id}`}
                style={{ fontWeight: 800, fontSize: "1.15rem", color: "inherit" }}
              >
                {trip.driver.name}
              </Link>
              <Verificado verificado={trip.driver.phoneVerified && Boolean(trip.driver.image)} />
            </div>
            {auto ? <p style={{ margin: "2px 0 0", color: "var(--texto-suave)" }}>🚗 {auto}</p> : null}
            <p style={{ margin: "6px 0 0" }}>
              {stats?.rating ? (
                <>
                  <Estrellas valor={stats.rating} /> <strong>{ratingLabel(stats.rating, stats.reviewCount)}</strong>
                </>
              ) : (
                <span style={{ color: "var(--texto-suave)" }}>Sin calificaciones todavía</span>
              )}
            </p>
            <p style={{ margin: "4px 0 0", color: "var(--verde)", fontWeight: 700 }}>
              Presentismo: {attendanceLabel(stats?.attendanceRate ?? null)}
            </p>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="dato">
            <span className="dato-clave">Aporte del viaje</span>
            <span className="dato-valor">{trip.contribution || "A convenir"}</span>
          </div>
          <div className="dato">
            <span className="dato-clave">Viajes completados</span>
            <span className="dato-valor">{stats?.completedTrips ?? 0}</span>
          </div>
          <div className="dato">
            <span className="dato-clave">Teléfono</span>
            <span className="dato-valor">
              {puedeVerTelefono && trip.driver.phone ? prettyPhone(trip.driver.phone) : "🔒 Se muestra al reservar"}
            </span>
          </div>
        </div>

        {trip.notes ? (
          <Alerta tipo="info">
            <strong>Dice el conductor:</strong> {trip.notes}
          </Alerta>
        ) : null}
      </section>

      {/* --- Pasajeros anotados --- */}
      <section className="tarjeta">
        <h2 className="tarjeta-titulo">
          Ya reservaron ({pasajerosConfirmados.length} de {trip.seatsTotal})
        </h2>
        {pasajerosConfirmados.length === 0 ? (
          <p style={{ margin: 0, color: "var(--texto-suave)" }}>
            Nadie se anotó todavía. Podés ser el primero o la primera.
          </p>
        ) : (
          <ul className="lista-limpia" style={{ display: "grid", gap: 10 }}>
            {pasajerosConfirmados.map((r) => (
              <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar src={r.passenger.image} nombre={r.passenger.name} chico />
                <span style={{ fontWeight: 700 }}>
                  {r.passenger.name.split(" ")[0]} {r.passenger.name.split(" ")[1]?.[0] ?? ""}.
                </span>
                {esConductor ? <span className="ayuda" style={{ margin: 0 }}>{prettyPhone(r.passenger.phone)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- Reservar --- */}
      <section aria-live="polite">
        {reservaActiva ? (
          <div className="tarjeta" style={{ borderColor: "var(--verde)" }}>
            <Alerta tipo="ok">Ya tenés tu asiento reservado en este viaje.</Alerta>
            {puedeVerTelefono && trip.driver.phone ? (
              <BotonWhatsApp
                telefono={trip.driver.phone}
                mensaje={mensajeReserva({ passengerName: user?.name ?? "", trip })}
                texto="💬 Escribirle al conductor por WhatsApp"
              />
            ) : null}
            <div style={{ marginTop: 10 }}>
              <EnlaceBoton href="/mis-reservas" variante="secundario">
                Ver mis reservas
              </EnlaceBoton>
            </div>
          </div>
        ) : esConductor ? (
          <div className="tarjeta">
            <Alerta tipo="info">Este viaje lo publicaste vos.</Alerta>
            <EnlaceBoton href="/mis-viajes" variante="secundario">
              Ir a mi panel de conductor
            </EnlaceBoton>
          </div>
        ) : cancelado ? (
          <Alerta tipo="error">El conductor canceló este viaje. Buscá otro disponible.</Alerta>
        ) : yaSalio ? (
          <Alerta tipo="info">Este viaje ya salió, pero podés calificar si viajaste.</Alerta>
        ) : !user ? (
          <div className="tarjeta">
            <h2 className="tarjeta-titulo">¿Querés ir?</h2>
            <p style={{ marginTop: 0, color: "var(--texto-suave)" }}>
              Ingresá en 1 clic para reservar tu asiento y ver el contacto del conductor.
            </p>
            <EnlaceBoton href={`/ingresar?volver=/viajes/${trip.id}`}>
              Ingresar y reservar
            </EnlaceBoton>
          </div>
        ) : !isProfileComplete(user) ? (
          <div className="tarjeta">
            <Alerta tipo="info">
              Para reservar te falta: {missingProfileItems(user).join(" y ")}.
            </Alerta>
            <EnlaceBoton href="/perfil">Completar mi perfil</EnlaceBoton>
          </div>
        ) : completo ? (
          <Alerta tipo="info">
            Se llenaron todos los asientos. Mirá otros viajes disponibles para el mismo día.
          </Alerta>
        ) : (
          <ReservarAsiento
            tripId={trip.id}
            driverName={trip.driver.name.split(" ")[0]}
            driverPhone={trip.driver.phone}
            mensajeWhatsApp={mensajeReserva({ passengerName: user.name, trip })}
          />
        )}
      </section>

      {/* --- Calificaciones del viaje --- */}
      {(faltanCalificar.length > 0 || trip.reviews.length > 0) ? (
        <section className="tarjeta">
          <h2 className="tarjeta-titulo">Calificaciones del viaje</h2>

          {faltanCalificar.map((persona) => (
            <div key={persona.id} style={{ marginBottom: 14 }}>
              <FormularioResena tripId={trip.id} targetId={persona.id} nombre={persona.name.split(" ")[0]} />
            </div>
          ))}

          {trip.reviews.length === 0 ? (
            <p style={{ margin: 0, color: "var(--texto-suave)" }}>Todavía no hay calificaciones de este viaje.</p>
          ) : (
            <ul className="lista-limpia" style={{ display: "grid", gap: 12 }}>
              {trip.reviews.map((review) => {
                const autor = trip.reservations.find((r) => r.passengerId === review.authorId)?.passenger;
                const nombreAutor = review.authorId === trip.driver.id ? trip.driver.name : (autor?.name ?? "Usuario");
                return (
                  <li key={review.id} style={{ borderTop: "1px dashed var(--borde)", paddingTop: 10 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Estrellas valor={review.rating} />
                      <strong>{nombreAutor}</strong>
                    </div>
                    {review.comment ? <p style={{ margin: "4px 0 0" }}>{review.comment}</p> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      <p style={{ color: "var(--texto-suave)", fontSize: "0.9rem" }}>
        Carpoo no cobra ni gestiona pagos: el aporte y el punto de encuentro los arreglan entre
        ustedes por WhatsApp.
      </p>
    </>
  );
}
