import { prisma } from "./db";

export type PublicStats = {
  /** Promedio de estrellas (1 a 5), o null si todavía no tiene calificaciones. */
  rating: number | null;
  reviewCount: number;
  /** Cantidad de viajes en los que participó y se completaron. */
  completedTrips: number;
  /** Porcentaje de presentismo (0 a 100), o null si es usuario nuevo. */
  attendanceRate: number | null;
  attendedCount: number;
  noShowCount: number;
  verified: boolean;
};

/**
 * Métricas públicas de una persona: reputación, historial y presentismo.
 * El "presentismo" es la métrica clave para que nadie reserve y no aparezca:
 * se calcula con las reservas que el conductor marcó como "asistió" o "no vino".
 */
export async function getPublicStats(user: {
  id: string;
  image: string | null;
  phoneVerified: boolean;
}): Promise<PublicStats> {
  const [ratingAgg, reservations, tripsAsDriver] = await Promise.all([
    prisma.review.aggregate({
      where: { targetId: user.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.reservation.findMany({
      where: { passengerId: user.id },
      select: { status: true },
    }),
    prisma.trip.count({ where: { driverId: user.id, status: "DONE" } }),
  ]);

  const attendedCount = reservations.filter((r) => r.status === "ATTENDED").length;
  const noShowCount = reservations.filter((r) => r.status === "NO_SHOW").length;
  const withAttendanceData = attendedCount + noShowCount;

  return {
    rating: ratingAgg._avg.rating ?? null,
    reviewCount: ratingAgg._count._all,
    completedTrips: tripsAsDriver + attendedCount,
    attendanceRate:
      withAttendanceData > 0 ? Math.round((attendedCount / withAttendanceData) * 100) : null,
    attendedCount,
    noShowCount,
    verified: user.phoneVerified && Boolean(user.image),
  };
}

export type MiniStats = {
  rating: number | null;
  reviewCount: number;
  attendanceRate: number | null;
  completedTrips: number;
};

/**
 * Métricas de varias personas de una sola vez (para las tarjetas de viaje).
 * Se resuelve con 3 consultas agrupadas, no con una por conductor.
 */
export async function getStatsForUsers(ids: string[]): Promise<Map<string, MiniStats>> {
  const map = new Map<string, MiniStats>();
  if (ids.length === 0) return map;

  const [ratings, reservations, doneTrips] = await Promise.all([
    prisma.review.groupBy({
      by: ["targetId"],
      where: { targetId: { in: ids } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.reservation.groupBy({
      by: ["passengerId", "status"],
      where: { passengerId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.trip.groupBy({
      by: ["driverId"],
      where: { driverId: { in: ids }, status: "DONE" },
      _count: { _all: true },
    }),
  ]);

  for (const id of ids) {
    map.set(id, {
      rating: null,
      reviewCount: 0,
      attendanceRate: null,
      completedTrips: 0,
    });
  }

  for (const row of ratings) {
    const entry = map.get(row.targetId);
    if (!entry) continue;
    entry.rating = row._avg.rating ?? null;
    entry.reviewCount = row._count._all;
  }

  const attendance = new Map<string, { attended: number; noShow: number }>();
  for (const row of reservations) {
    const entry = attendance.get(row.passengerId) ?? { attended: 0, noShow: 0 };
    if (row.status === "ATTENDED") entry.attended += row._count._all;
    if (row.status === "NO_SHOW") entry.noShow += row._count._all;
    attendance.set(row.passengerId, entry);
  }
  for (const [id, entry] of attendance) {
    const stats = map.get(id);
    if (!stats) continue;
    const total = entry.attended + entry.noShow;
    stats.attendanceRate = total > 0 ? Math.round((entry.attended / total) * 100) : null;
    stats.completedTrips += entry.attended;
  }

  for (const row of doneTrips) {
    const stats = map.get(row.driverId);
    if (!stats) continue;
    stats.completedTrips += row._count._all;
  }

  return map;
}

/** Texto corto y claro para mostrar la reputación. */
export function ratingLabel(rating: number | null, count: number): string {
  if (rating === null || count === 0) return "Sin calificaciones todavía";
  return `${rating.toFixed(1)} de 5 (${count} ${count === 1 ? "opinión" : "opiniones"})`;
}

/** Texto corto para el presentismo. */
export function attendanceLabel(rate: number | null): string {
  if (rate === null) return "Todavía sin viajes";
  if (rate >= 95) return `${rate}% ¡Excelente!`;
  if (rate >= 80) return `${rate}%`;
  return `${rate}% (reservó y no apareció algunas veces)`;
}
