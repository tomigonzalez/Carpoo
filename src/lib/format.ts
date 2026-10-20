/**
 * Formateo de fechas y horas en castellano rioplatense.
 *
 * Importante: estas funciones se usan SOLO en el servidor (componentes de
 * servidor / server actions). Así lo que se muestra siempre coincide con la
 * hora que cargó el conductor, sin desfasajes de zona horaria en el navegador.
 */

const DAY = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTH = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

/** "08:00 hs" */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())} hs`;
}

/** "21/10/2026" */
export function formatDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "martes 21 de octubre" */
export function formatLongDate(date: Date): string {
  return `${DAY[date.getDay()]} ${date.getDate()} de ${MONTH[date.getMonth()]}`;
}

/** "martes 21 de octubre, 08:00 hs" */
export function formatTripDate(date: Date): string {
  return `${formatLongDate(date)}, ${formatTime(date)}`;
}

/** "Hoy", "Mañana", "En 3 días" o "Hace 2 días" */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(date) - startOf(now)) / 86_400_000);

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  if (diffDays === -1) return "Ayer";
  if (diffDays > 1) return `En ${diffDays} días`;
  return `Hace ${Math.abs(diffDays)} días`;
}

export function isPast(date: Date, now: Date = new Date()): boolean {
  return date.getTime() < now.getTime();
}

/** Convierte "2026-10-21" + "08:30" (hora local del servidor) en Date. */
export function parseTripDateTime(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;

  const parsed = new Date(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    Number(t[1]),
    Number(t[2]),
    0,
    0,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Ayuda para el <input type="date">: fecha de hoy como YYYY-MM-DD. */
export function todayInputValue(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
