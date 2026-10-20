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

/** Tarjeta de viaje: se ve de un vistazo quién maneja y cuántos lugares quedan. */
export function TripCard({ trip, stats }: { trip: TripLike; stats?: MiniStats }) {
  const libres = Math.max(trip.seatsTotal - trip.seatsTaken, 0);
  const cancelado = trip.status === "CANCELLED";
  const completo = trip.status === "FULL" || libres === 0;
  const auto = [trip.driver.carColor, trip.driver.carModel].filter(Boolean).join(" ");

  return (
    <Link
      href={`/viajes/${trip.id}`}
      className="tarjeta"
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        opacity: cancelado ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "var(--texto-suave)" }}>
            {formatRelativeDay(trip.dateTime)} · {formatTripDate(trip.dateTime).split(", ")[1]}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "1.3rem", fontWeight: 800 }}>
            {trip.origin} → {trip.destination}
          </p>
          <p style={{ margin: "2px 0 0", color: "var(--texto-suave)", fontSize: "0.9rem" }}>
            {formatTripDate(trip.dateTime)}
          </p>
        </div>
        {cancelado ? (
          <Estado tipo="rojo">Cancelado</Estado>
        ) : completo ? (
          <Estado tipo="aviso">Completo</Estado>
        ) : (
          <Estado tipo="ok">
            {libres} {libres === 1 ? "lugar libre" : "lugares libres"}
          </Estado>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px dashed var(--borde)",
        }}
      >
        <Avatar src={trip.driver.image} nombre={trip.driver.name} chico />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ fontSize: "1.05rem" }}>{trip.driver.name}</strong>
            <Verificado verificado={trip.driver.phoneVerified && Boolean(trip.driver.image)} />
          </div>
          <p style={{ margin: "2px 0 0", color: "var(--texto-suave)", fontSize: "0.9rem" }}>
            {auto ? `${auto} · ` : ""}
            {stats?.rating ? (
              <>
                <Estrellas valor={stats.rating} /> {stats.rating.toFixed(1)}
              </>
            ) : (
              "Sin calificaciones aún"
            )}
          </p>
          {stats?.attendanceRate !== null && stats?.attendanceRate !== undefined ? (
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--verde)" }}>
              Presentismo: {attendanceLabel(stats.attendanceRate)}
            </p>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        <span style={{ fontSize: "0.95rem", color: "var(--texto-suave)" }}>
          Aporte: <strong style={{ color: "var(--texto)" }}>{trip.contribution || "A convenir"}</strong>
        </span>
        <span
          className="btn btn-primario btn-chico"
          aria-hidden="true"
          style={{ minWidth: 130, pointerEvents: "none" }}
        >
          Ver el viaje
        </span>
      </div>
      <span className="oculto-visual">
        Ver el viaje de {trip.driver.name} desde {trip.origin} a {trip.destination} el{" "}
        {formatTripDate(trip.dateTime)} a las {formatTime(trip.dateTime)}
      </span>
    </Link>
  );
}
