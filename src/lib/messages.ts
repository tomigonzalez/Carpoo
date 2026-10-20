import { formatTripDate } from "./format";

type DatosViaje = { origin: string; destination: string; dateTime: Date };

/** Primer nombre, para saludar de forma natural. */
function nombreCorto(nombre: string): string {
  return nombre.split(" ")[0];
}

/** Mensaje que le llega al conductor cuando alguien reserva. */
export function mensajeReserva({
  passengerName,
  trip,
}: {
  passengerName: string;
  trip: DatosViaje;
}): string {
  return [
    `Hola, soy ${passengerName}. Reservé un asiento en tu viaje de Carpoo.`,
    `${trip.origin} → ${trip.destination}, ${formatTripDate(trip.dateTime)}.`,
    "¿Nos encontramos en algún punto en particular y cómo te paso el aporte?",
  ].join(" ");
}

/** Mensaje del conductor al pasajero anotado. */
export function mensajeConductor({
  driverName,
  passengerName,
  trip,
}: {
  driverName: string;
  passengerName: string;
  trip: DatosViaje;
}): string {
  return [
    `Hola ${nombreCorto(passengerName)}, soy ${nombreCorto(driverName)}, el conductor del viaje de Carpoo.`,
    `${trip.origin} → ${trip.destination}, ${formatTripDate(trip.dateTime)}.`,
    "Te escribo para coordinar el punto de encuentro y el aporte.",
  ].join(" ");
}
