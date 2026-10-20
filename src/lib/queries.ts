import { prisma } from "./db";

/** Buscador: origen, destino y fecha. Solo viajes que todavía se pueden reservar. */
export async function searchTrips(filters: {
  origin?: string;
  destination?: string;
  date?: string;
  includeFull?: boolean;
}) {
  const where: Record<string, unknown> = {
    status: filters.includeFull ? { in: ["ACTIVE", "FULL"] } : "ACTIVE",
    dateTime: { gte: startOfDay(new Date()) },
  };

  if (filters.origin) {
    where.origin = { contains: filters.origin };
  }
  if (filters.destination) {
    where.destination = { contains: filters.destination };
  }
  if (filters.date) {
    const day = new Date(`${filters.date}T00:00:00`);
    if (!Number.isNaN(day.getTime())) {
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      where.dateTime = { gte: day, lt: next };
    }
  }

  return prisma.trip.findMany({
    where,
    orderBy: { dateTime: "asc" },
    take: 60,
    include: {
      driver: { select: { id: true, name: true, image: true, phoneVerified: true, carModel: true, carColor: true } },
      _count: { select: { reservations: { where: { status: "CONFIRMED" } } } },
    },
  });
}

/** Últimos viajes publicados, para mostrar en la pantalla de inicio. */
export async function getUpcomingTrips(limit = 4) {
  return prisma.trip.findMany({
    where: { status: { in: ["ACTIVE", "FULL"] }, dateTime: { gte: new Date() } },
    orderBy: { dateTime: "asc" },
    take: limit,
    include: {
      driver: { select: { id: true, name: true, image: true, phoneVerified: true, carModel: true, carColor: true } },
      _count: { select: { reservations: { where: { status: "CONFIRMED" } } } },
    },
  });
}

export async function getTripDetail(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      driver: true,
      reservations: {
        orderBy: { createdAt: "asc" },
        include: { passenger: { select: { id: true, name: true, image: true, phone: true, phoneVerified: true } } },
      },
      reviews: true,
    },
  });
}

/** Panel del conductor: sus viajes, con los pasajeros anotados. */
export async function getTripsAsDriver(driverId: string) {
  return prisma.trip.findMany({
    where: { driverId },
    orderBy: { dateTime: "desc" },
    take: 50,
    include: {
      reservations: {
        where: { status: { in: ["CONFIRMED", "ATTENDED", "NO_SHOW"] } },
        orderBy: { createdAt: "asc" },
        include: { passenger: { select: { id: true, name: true, image: true, phone: true } } },
      },
    },
  });
}

/** Mis reservas como pasajero, con el viaje y el conductor. */
export async function getReservationsAsPassenger(passengerId: string) {
  return prisma.reservation.findMany({
    where: { passengerId },
    orderBy: { trip: { dateTime: "desc" } },
    take: 50,
    include: {
      trip: { include: { driver: { select: { id: true, name: true, image: true, phone: true, carModel: true, carColor: true, carPlate: true } } } },
    },
  });
}

export async function getReviewsReceived(userId: string, limit = 10) {
  return prisma.review.findMany({
    where: { targetId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      author: { select: { id: true, name: true, image: true } },
      trip: { select: { origin: true, destination: true, dateTime: true } },
    },
  });
}

/** Próximos viajes publicados por una persona, para su perfil público. */
export async function getDriverUpcomingTrips(driverId: string) {
  return prisma.trip.findMany({
    where: { driverId, status: { in: ["ACTIVE", "FULL"] }, dateTime: { gte: new Date() } },
    orderBy: { dateTime: "asc" },
    take: 5,
    include: {
      driver: {
        select: { id: true, name: true, image: true, phoneVerified: true, carModel: true, carColor: true },
      },
      _count: { select: { reservations: { where: { status: "CONFIRMED" } } } },
    },
  });
}

/** Reseñas que escribió una persona (para no repetir el formulario). */
export async function getReviewsByAuthor(authorId: string) {
  return prisma.review.findMany({
    where: { authorId },
    select: { tripId: true, targetId: true, rating: true, comment: true },
  });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
