import {
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  startOfYear,
  today as todayIn,
  type CalendarDate,
} from '@internationalized/date';
import type { IsoDateRange } from './iso-date';

/** A quick pick shown beside the calendar ("Last 7 days"). */
export type RangePreset = {
  /** The button text. */
  label: string;
  /** The range it picks, both ends included. */
  value: IsoDateRange;
};

const iso = (start: CalendarDate, end: CalendarDate): IsoDateRange => ({
  start: start.toString(),
  end: end.toString(),
});

/**
 * The quick picks most report filters want, worked out from `today`. Both ends are
 * included, so "Last 7 days" is today and the 6 days before it.
 *
 * `today` defaults to today in the user's time zone (pass one in tests, or to use the
 * company's time zone instead). Call it when the picker renders, not once at import:
 * a page left open past midnight should move on to the new day.
 *
 * @example
 * <DateRangePicker presets={commonRangePresets()} … />
 * // or pick and rename: commonRangePresets().filter((p) => p.label !== 'Today')
 */
export function commonRangePresets(
  today: CalendarDate = todayIn(getLocalTimeZone()),
): RangePreset[] {
  const lastMonth = startOfMonth(today).subtract({ months: 1 });
  return [
    { label: 'Today', value: iso(today, today) },
    { label: 'Last 7 days', value: iso(today.subtract({ days: 6 }), today) },
    { label: 'Last 30 days', value: iso(today.subtract({ days: 29 }), today) },
    { label: 'Month to date', value: iso(startOfMonth(today), today) },
    { label: 'Last month', value: iso(lastMonth, endOfMonth(lastMonth)) },
    { label: 'Year to date', value: iso(startOfYear(today), today) },
  ];
}
