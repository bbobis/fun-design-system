import { parseDate, type CalendarDate } from '@internationalized/date';

/** `'2026-10-04'` → CalendarDate, or null for empty / malformed text. */
export function toCalendarDate(
  value: string | null | undefined,
): CalendarDate | null {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

/**
 * True for a real calendar day written as `'YYYY-MM-DD'`. Rejects impossible days
 * ('2026-02-30') and every other spelling ('3/10/2026' is March 10 or October 3,
 * depending on who typed it, so we don't guess).
 */
export function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  // parseDate quietly fixes '2026-02-30' to Feb 28; a round trip catches that.
  return toCalendarDate(text)?.toString() === text;
}

/** A range of calendar days, both ends included, as ISO dates. */
export type IsoDateRange = { start: string; end: string };

/** `{ start, end }` ISO strings → React Aria's range, or null if either end is missing or malformed. */
export function toCalendarRange(
  value: IsoDateRange | null | undefined,
): { start: CalendarDate; end: CalendarDate } | null {
  const start = toCalendarDate(value?.start);
  const end = toCalendarDate(value?.end);
  return start && end ? { start, end } : null;
}
