import { format } from 'date-fns';

/** "2026-10-13" — safe for storing calendar dates (no timezone drift). */
export function toISODate(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

/** Long header date: "Tuesday, October 13, 2026". */
export function formatFullDate(date: Date = new Date()): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

/** Compact header date for small screens: "Tue 13 Oct". */
export function formatShortDate(date: Date = new Date()): string {
  return format(date, 'EEE d MMM');
}

/** "25 MIN" or "1H 05M" for session durations. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} MIN`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}H` : `${hours}H ${String(rest).padStart(2, '0')}M`;
}
