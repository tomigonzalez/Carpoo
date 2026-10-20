"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, isProfileComplete } from "@/lib/session";
import { cleanInt, cleanText } from "@/lib/validate";
import { parseTripDateTime } from "@/lib/format";
import type { ActionState } from "@/lib/action-state";

function refreshTripViews(tripId?: string) {
  revalidatePath("/");
  revalidatePath("/buscar");
  revalidatePath("/mis-viajes");
  revalidatePath("/mis-reservas");
  if (tripId) revalidatePath(`/viajes/${tripId}`);
}

/** Publicar un viaje: Origen, Destino, Fecha, Hora y asientos disponibles. */
export async function createTrip(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión." };
  if (!isProfileComplete(user)) {
    return {
      error:
        "Para ofrecer un viaje necesitás foto de perfil y teléfono verificado. Completá tu perfil y volvé a intentar.",
    };
  }

  const origin = cleanText(formData.get("origin"), 80);
  const destination = cleanText(formData.get("destination"), 80);
  const date = cleanText(formData.get("date"), 10);
  const time = cleanText(formData.get("time"), 5);
  const seats = cleanInt(formData.get("seats"), 1, 8);

  if (!origin) return { error: "Escribí desde dónde salís." };
  if (!destination) return { error: "Escribí a dónde vas." };
  if (origin.toLowerCase() === destination.toLowerCase()) {
    return { error: "El origen y el destino no pueden ser el mismo lugar." };
  }
  if (!date || !time) return { error: "Elegí la fecha y la hora de salida." };

  const dateTime = parseTripDateTime(date, time);
  if (!dateTime) return { error: "La fecha o la hora no son válidas." };
  if (dateTime.getTime() < Date.now() - 60_000) {
    return { error: "La salida tiene que ser en el futuro. Revisá la fecha y la hora." };
  }
  if (!seats) return { error: "Elegí cuántos asientos ofrecés (1 a 8)." };

  const trip = await prisma.trip.create({
    data: {
      driverId: user.id,
      origin,
      destination,
      dateTime,
      seatsTotal: seats,
      contribution: cleanText(formData.get("contribution"), 60) ?? "A convenir",
      notes: cleanText(formData.get("notes"), 300),
      status: "ACTIVE",
    },
  });

  refreshTripViews(trip.id);
  redirect("/mis-viajes?publicado=1");
}

async function findOwnTrip(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return null;
  if (trip.driverId !== userId) return null;
  return trip;
}

/** El conductor marca el viaje como Completo, vuelve a habilitarlo o lo Cancela. */
export async function setTripStatus(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const tripId = String(formData.get("tripId") ?? "");
  const status = String(formData.get("status") ?? "");
  const trip = await findOwnTrip(tripId, user.id);
  if (!trip) return;

  if (status === "CANCELLED") {
    await prisma.$transaction([
      prisma.reservation.updateMany({
        where: { tripId, status: "CONFIRMED" },
        data: { status: "CANCELLED" },
      }),
      prisma.trip.update({
        where: { id: tripId },
        data: { status: "CANCELLED", seatsTaken: 0 },
      }),
    ]);
  } else if (status === "FULL") {
    await prisma.trip.update({ where: { id: tripId }, data: { status: "FULL" } });
  } else if (status === "ACTIVE") {
    const free = trip.seatsTotal - trip.seatsTaken;
    if (free <= 0) return; // No se puede reactivar sin asientos libres.
    await prisma.trip.update({ where: { id: tripId }, data: { status: "ACTIVE" } });
  } else if (status === "DONE") {
    if (trip.dateTime.getTime() > Date.now()) return; // Todavía no salió.
    await prisma.trip.update({ where: { id: tripId }, data: { status: "DONE" } });
  }

  refreshTripViews(tripId);
}

/** Edita detalles livianos del viaje (aporte, aclaraciones y asientos). */
export async function updateTrip(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Primero iniciá sesión." };

  const tripId = String(formData.get("tripId") ?? "");
  const trip = await findOwnTrip(tripId, user.id);
  if (!trip) return { error: "No encontramos ese viaje." };

  const seats = cleanInt(formData.get("seats"), 1, 8);
  if (seats === null) return { error: "Los asientos deben ser un número entre 1 y 8." };
  if (seats < trip.seatsTaken) {
    return {
      error: `Ya hay ${trip.seatsTaken} ${trip.seatsTaken === 1 ? "persona anotada" : "personas anotadas"}. No podés bajar de ese número.`,
    };
  }

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      contribution: cleanText(formData.get("contribution"), 60) ?? "A convenir",
      notes: cleanText(formData.get("notes"), 300),
      seatsTotal: seats,
      status: seats === trip.seatsTaken && trip.status !== "CANCELLED" ? "FULL" : trip.status,
    },
  });

  refreshTripViews(tripId);
  return { ok: "Guardamos los cambios." };
}
