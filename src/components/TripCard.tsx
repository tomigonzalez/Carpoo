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

/** Tarjeta de viaje: más compacta y escaneable al estilo web. */
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
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "var(--texto-suave)" }}>
            {formatRelativeDay(trip.dateTime)} · {formatTripDate(trip.dateTime).split(", ")[1]}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: "1.18rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            {trip.origin} → {trip.destination}
          </p>
          <p style={{ margin: "1px 0 0", color: "var(--texto-suave)", fontSize: "0.9rem" }}>
            {formatTripDate(trip.dateTime)}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {cancelado ? (
            <Estado tipo="rojo">Cancelado</Estado>
          ) : completo ? (
            <Estado tipo="aviso">Completo</Estado>
          ) : (
            <Estado tipo="ok">
              {libres} {libres === 1 ? "lugar libre" : "lugares libres"}
            </Estado>
          )}
          <span style={{ fontSize: "0.9rem", color: "var(--texto-suave)" }}>
            Aporte: <strong style={{ color: "var(--texto)" }}>{trip.contribution || "A convenir"}</strong>
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--borde)",
          flexWrap: "wrap",
        }}
      >
        <Avatar src={trip.driver.image} nombre={trip.driver.name} chico />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <strong>{trip.driver.name}</strong>
            <Verificado verificado={trip.driver.phoneVerified && Boolean(trip.driver.image)} />
          </div>
          <p style={{ margin: "1px 0 0", color: "var(--texto-suave)", fontSize: "0.9rem" }}>
            {auto ? `${auto} · ` : ""}
            {stats?.rating ? (
              <>
                <Estrellas valor={stats.rating} /> {stats.rating.toFixed(1)}
              </>
            ) : (
              "Sin calificaciones aún"
            )}
            {stats?.attendanceRate !== null && stats?.attendanceRate !== undefined ? (
              <> · Presentismo: {attendanceLabel(stats.attendanceRate)}</>
            ) : null}
          </p>
        </div>
        <span className="btn btn-secundario btn-chico" aria-hidden="true" style={{ pointerEvents: "none" }}>
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

