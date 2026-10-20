import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Cupos en vivo de un viaje. La pantalla del viaje consulta esto cada pocos
 * segundos para que el número de asientos libres esté siempre al día, aunque
 * otra persona reserve desde otro celular.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/viajes/[id]/cupos">) {
  const { id } = await ctx.params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { seatsTotal: true, seatsTaken: true, status: true },
  });

  if (!trip) {
    return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });
  }

  return NextResponse.json(
    {
      seatsTotal: trip.seatsTotal,
      seatsTaken: trip.seatsTaken,
      free: Math.max(trip.seatsTotal - trip.seatsTaken, 0),
      status: trip.status,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
