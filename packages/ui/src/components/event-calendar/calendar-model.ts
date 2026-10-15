import type { CalendarDate } from '@internationalized/date';
import { toCalendarDate } from '../date-picker/iso-date';

/*
 * The data model shared by the month and week views: event types, colours, and
 * "which events are on which day". No React here.
 */

/** Colour of an event, same names as Badge. Always pair it with a clear title. */
export type EventTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type CalendarEvent = {
  /** Unique, stable id. Passed back to `onEventAction`. */
  id: string;
  /** The day, `'YYYY-MM-DD'`. */
  date: string;
  /**
   * Last day for an event that spans several days, `'YYYY-MM-DD'`, inclusive
   * (Oct 14 → Oct 16 is 3 days). It shows on every day it covers. Leave out for
   * one-day events. An end before `date`, or a malformed one, is ignored.
   */
  endDate?: string;
  /** Start time, `'HH:mm'` (24-hour, like TimeField). Leave out for all-day events. */
  time?: string;
  /**
   * End time, `'HH:mm'`, for events with a `time`. Sets the block's height in the week
   * view. Missing, or not after `time` → drawn as 30 minutes.
   */
  endTime?: string;
  /** Short title shown in the day cell and the day list. */
  title: string;
  /** @default 'neutral' */
  tone?: EventTone;
};

export const chipTone: Record<EventTone, string> = {
  neutral: 'bg-surface text-fg',
  info: 'bg-info-soft text-on-info-soft',
  success: 'bg-success-soft text-on-success-soft',
  warning: 'bg-warning-soft text-on-warning-soft',
  danger: 'bg-danger-soft text-on-danger-soft',
};
export const dotTone: Record<EventTone, string> = {
  neutral: 'bg-fg-muted',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** One event on one day: which day of its span this is ("day 2 of 3"). */
export type DayEntry = { event: CalendarEvent; day: number; days: number };

/** Longest span drawn, so a typo in `endDate` ('2062' for '2026') can't freeze the page. */
const MAX_SPAN_DAYS = 366;

/**
 * Events per day, `'YYYY-MM-DD'` → entries. A multi-day event gets an entry on each
 * day it covers. Order: spans first (earliest start first), then all-day, then by time,
 * so a span sits at the top of each day it crosses, as in Outlook.
 */
export function groupByDay(
  events: readonly CalendarEvent[],
): Map<string, DayEntry[]> {
  const map = new Map<string, DayEntry[]>();
  const add = (key: string, entry: DayEntry) =>
    map.set(key, [...(map.get(key) ?? []), entry]);
  for (const event of events) {
    const start = toCalendarDate(event.date);
    if (!start) continue;
    const end = toCalendarDate(event.endDate);
    const days =
      end && end.compare(start) > 0
        ? Math.min(end.compare(start) + 1, MAX_SPAN_DAYS)
        : 1;
    for (let i = 0; i < days; i++)
      add(start.add({ days: i }).toString(), { event, day: i + 1, days });
  }
  for (const list of map.values())
    list.sort(
      (a, b) =>
        Number(b.days > 1) - Number(a.days > 1) ||
        a.event.date.localeCompare(b.event.date) ||
        (a.event.time ?? '').localeCompare(b.event.time ?? ''),
    );
  return map;
}

/** `'2026-10-15'` → `'2026-10'`. */
export const monthOf = (date: CalendarDate) => date.toString().slice(0, 7);
