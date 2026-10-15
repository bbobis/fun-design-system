import { parseTime, type Time } from '@internationalized/date';

/** How exact the field is: hours and minutes, or seconds too. */
export type TimeGranularity = 'minute' | 'second';

/**
 * `'14:30'` or `'14:30:15'` → React Aria's `Time`, or null for empty / malformed text.
 * Rejects out-of-range times ('25:00', '12:60') instead of quietly fixing them.
 */
export function toTime(value: string | null | undefined): Time | null {
  if (!value || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
  try {
    const time = parseTime(value);
    // parseTime accepts '24:00' style edge cases on some versions; a round trip catches them.
    return fromTime(time, value.length > 5 ? 'second' : 'minute') === value
      ? time
      : null;
  } catch {
    return null;
  }
}

/** `Time` → `'14:30'` (minute) or `'14:30:15'` (second). Always 24-hour, zero-padded. */
export function fromTime(time: Time, granularity: TimeGranularity): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(time.hour)}:${pad(time.minute)}`;
  return granularity === 'second' ? `${hm}:${pad(time.second)}` : hm;
}
