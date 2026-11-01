import Link from "next/link";
import { formatRelativeDay, formatTripDate, formatTime } from "@/lib/format";
import { attendanceLabel } from "@/lib/stats";
import type { MiniStats } from "@/lib/stats";
import { Avatar, Estado, Estrellas, Verificado } from "./ui";

type TripLike = {
  id: string;
  origin: string;
  destination: string;
  dateTime: Date;
  seatsTotal: number;
  seatsTaken: number;
  status: string;
  contribution: string | null;
  driver: {
    id: string;
    name: string;
    image: string | null;
    phoneVerified: boolean;
    carModel: string | null;
    carColor: string | null;
  };
};

/** Tarjeta de viaje: clara, escaneable y con la ruta como protagonista. */
export function TripCard({ trip, stats }: { trip: TripLike; stats?: MiniStats }) {
  const libres = Math.max(trip.seatsTotal - trip.seatsTaken, 0);
  const cancelado = trip.status === "CANCELLED";
  const completo = trip.status === "FULL" || libres === 0;
  const auto = [trip.driver.carColor, trip.driver.carModel].filter(Boolean).join(" ");

  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="tarjeta viaje-card"
      style={{ opacity: cancelado ? 0.72 : 1 }}
    >
      <div className="viaje-cabecera">
        <div>
          <p className="viaje-fecha">{formatRelativeDay(trip.dateTime)}</p>
          <h3 className="viaje-ruta">
            <span>{trip.origin}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="M4 12h15" strokeLinecap="round" />
              <path d="m13 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{trip.destination}</span>
          </h3>
          <p className="viaje-fecha-larga">{formatTripDate(trip.dateTime)}</p>
        </div>
        <div className="viaje-lado">
          {cancelado ? (
            <Estado tipo="rojo">Cancelado</Estado>
          ) : completo ? (
            <Estado tipo="aviso">Completo</Estado>
          ) : (
            <Estado tipo="ok">
              {libres} {libres === 1 ? "lugar libre" : "lugares libres"}
            </Estado>
          )}
          <span className="viaje-aporte">
            Aporte: <strong>{trip.contribution || "A convenir"}</strong>
          </span>
        </div>
      </div>

      <div className="viaje-pie">
        <Avatar src={trip.driver.image} nombre={trip.driver.name} chico />
        <div className="viaje-conductor">
          <div className="viaje-conductor-nombre">
            <strong>{trip.driver.name}</strong>
            <Verificado verificado={trip.driver.phoneVerified && Boolean(trip.driver.image)} />
          </div>
          <p className="viaje-conductor-meta">
            {auto ? <span>Auto: {auto}</span> : null}
            {stats?.rating ? (
              <span>
                <Estrellas valor={stats.rating} /> {stats.rating.toFixed(1)}
              </span>
            ) : (
              <span>Sin calificaciones aún</span>
            )}
            {stats?.attendanceRate !== null && stats?.attendanceRate !== undefined ? (
              <span>Presentismo: {attendanceLabel(stats.attendanceRate)}</span>
            ) : null}
          </p>
        </div>
        <div className="viaje-accion">
          <span className="btn btn-secundario btn-chico" aria-hidden="true">
            Ver el viaje
          </span>
        </div>
      </div>
      <span className="oculto-visual">
        Ver el viaje de {trip.driver.name} desde {trip.origin} a {trip.destination} el{" "}
        {formatTripDate(trip.dateTime)} a las {formatTime(trip.dateTime)}
      </span>
    </Link>
  );
}
