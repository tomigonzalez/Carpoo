"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, isProfileComplete } from "@/lib/session";
import { cleanInt, cleanText } from "@/lib/validate";
import type { ActionState } from "@/lib/action-state";

function refreshViews(tripId?: string) {
  revalidatePath("/");
  revalidatePath("/buscar");
  revalidatePath("/mis-reservas");
  revalidatePath("/mis-viajes");
  if (tripId) revalidatePath(`/viajes/${tripId}`);
}

/**
 * Solicitar un asiento. La solicitud queda PENDING hasta que el conductor la acepte.
 * No se descuenta cupo hasta la aceptación.
 */
export async function requestSeat(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión para solicitar un asiento." };
  if (!isProfileComplete(user)) {
    return {
      error:
        "Para solicitar un asiento necesitás foto de perfil y teléfono verificado. Completá tu perfil y volvé a intentar.",
    };
  }

  const tripId = String(formData.get("tripId") ?? "");

  try {
    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw new Error("No encontramos ese viaje.");
      if (trip.driverId === user.id) throw new Error("Este viaje lo publicaste vos mismo.");
      if (trip.status === "CANCELLED") throw new Error("Ese viaje fue cancelado.");
      if (trip.status === "DONE") throw new Error("Ese viaje ya se realizó.");
      if (trip.dateTime.getTime() < Date.now()) throw new Error("Ese viaje ya salió.");

      const confirmedCount = await tx.reservation.count({
        where: { tripId, status: "CONFIRMED" },
      });
      if (confirmedCount >= trip.seatsTotal) throw new Error("Se acaba de llenar. Probá con otro viaje.");

      const existing = await tx.reservation.findUnique({
        where: { tripId_passengerId: { tripId, passengerId: user.id } },
      });
      if (existing) {
        if (existing.status === "CONFIRMED") {
          throw new Error("Ya tenés un asiento confirmado en este viaje.");
        }
        if (existing.status === "PENDING") {
          throw new Error("Ya enviaste una solicitud para este viaje.");
        }
        if (existing.status === "ATTENDED") {
          throw new Error("Ya viajaste en este viaje.");
        }
        await tx.reservation.update({
          where: { id: existing.id },
          data: { status: "PENDING" },
        });
      } else {
        await tx.reservation.create({
          data: { tripId, passengerId: user.id, status: "PENDING" },
        });
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No pudimos enviar la solicitud.";
    return { error: message };
  }

  refreshViews(tripId);
  return { ok: "Solicitud enviada. El conductor la va a revisar y te va a avisar." };
}

/** Compatibilidad: mantiene nombre anterior apuntando al nuevo flujo. */
export const reserveSeat = requestSeat;

/** El pasajero cancela su solicitud o su reserva confirmada. */
export async function cancelMyReservation(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const reservationId = String(formData.get("reservationId") ?? "");

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation || reservation.passengerId !== user.id) return;
    if (reservation.status === "CANCELLED" || reservation.status === "ATTENDED" || reservation.status === "NO_SHOW") return;

    if (reservation.status === "CONFIRMED") {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" },
      });
      await tx.trip.update({
        where: { id: reservation.tripId },
        data: {
          seatsTaken: { decrement: 1 },
          status: "ACTIVE",
        },
      });
    } else if (reservation.status === "PENDING") {
      await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" },
      });
    }
  });

  refreshViews();
}

/** El pasajero confirma que viajó (suma a su presentismo). */
export async function confirmMyAttendance(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const reservationId = String(formData.get("reservationId") ?? "");
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { trip: true },
  });
  if (!reservation || reservation.passengerId !== user.id) return;
  if (reservation.status !== "CONFIRMED") return;

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "ATTENDED" },
  });
  refreshViews(reservation.tripId);
}

/** El conductor acepta una solicitud pendiente. */
export async function acceptRequest(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const reservationId = String(formData.get("reservationId") ?? "");

  await prisma.$transaction(async (tx) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
      include: { trip: true },
    });
    if (!reservation) return;
    if (reservation.trip.driverId !== user.id) return;
    if (reservation.status !== "PENDING") return;
    if (reservation.trip.status === "CANCELLED") return;
    if (reservation.trip.status === "DONE") return;
    if (reservation.trip.dateTime.getTime() < Date.now()) return;

    const confirmedCount = await tx.reservation.count({
      where: { tripId: reservation.tripId, status: "CONFIRMED" },
    });
    if (confirmedCount >= reservation.trip.seatsTotal) return;

    const taken = await tx.trip.updateMany({
      where: { id: reservation.tripId, seatsTaken: { lt: reservation.trip.seatsTotal } },
      data: { seatsTaken: { increment: 1 } },
    });
    if (taken.count === 0) return;

    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "CONFIRMED" },
    });

    const after = await tx.trip.findUnique({ where: { id: reservation.tripId } });
    if (after && after.seatsTaken >= after.seatsTotal) {
      await tx.trip.update({ where: { id: reservation.tripId }, data: { status: "FULL" } });
    }
  });

  refreshViews();
}

/** El conductor rechaza una solicitud pendiente. */
export async function rejectRequest(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const reservationId = String(formData.get("reservationId") ?? "");

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { trip: true },
  });
  if (!reservation) return;
  if (reservation.trip.driverId !== user.id) return;
  if (reservation.status !== "PENDING") return;

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });

  refreshViews(reservation.tripId);
}

/** El conductor marca si cada pasajero viajó o no apareció (presentismo). */
export async function markPassengerStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const reservationId = String(formData.get("reservationId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["ATTENDED", "NO_SHOW", "CONFIRMED"].includes(status)) return;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { trip: true },
  });
  if (!reservation || reservation.trip.driverId !== user.id) return;

  await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: status as "ATTENDED" | "NO_SHOW" | "CONFIRMED" },
  });
  refreshViews(reservation.tripId);
}

/** Calificación de 1 a 5 estrellas con comentario corto, al terminar el viaje. */
export async function submitReview(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión." };

  const tripId = String(formData.get("tripId") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const rating = cleanInt(formData.get("rating"), 1, 5);
  const comment = cleanText(formData.get("comment"), 280);

  if (!rating) return { error: "Elegí de 1 a 5 estrellas." };
  if (!targetId || targetId === user.id) return { error: "No pudimos identificar a la persona." };

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { reservations: true },
  });
  if (!trip) return { error: "No encontramos ese viaje." };
  if (trip.dateTime.getTime() > Date.now()) {
    return { error: "Todavía no se realizó el viaje. Podés calificar después de la salida." };
  }

  const isDriver = trip.driverId === user.id;
  const isPassenger = trip.reservations.some((r) => r.passengerId === user.id);
  if (!isDriver && !isPassenger) return { error: "No participaste de este viaje." };

  const targetIsDriver = trip.driverId === targetId;
  const targetIsPassenger = trip.reservations.some((r) => r.passengerId === targetId);
  if (!targetIsDriver && !targetIsPassenger) return { error: "Esa persona no participó del viaje." };

  await prisma.review.upsert({
    where: { tripId_authorId_targetId: { tripId, authorId: user.id, targetId } },
    update: { rating, comment },
    create: { tripId, authorId: user.id, targetId, rating, comment },
  });

  refreshViews(tripId);
  revalidatePath("/perfil");
  revalidatePath(`/usuarios/${targetId}`);
  return { ok: "¡Gracias! Tu calificación quedó guardada." };
}
