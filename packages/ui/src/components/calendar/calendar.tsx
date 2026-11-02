import { cva } from 'class-variance-authority';
import type { DateValue } from 'react-aria-components';
import {
  Calendar as AriaCalendar,
  RangeCalendar as AriaRangeCalendar,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  CalendarSizeContext,
  DayGrid,
  MonthHeader,
  useMediaQuery,
  WIDE_ENOUGH,
  type CalendarSize,
} from '../date-picker/calendar-parts';
import {
  toCalendarDate,
  toCalendarRange,
  type IsoDateRange,
} from '../date-picker/iso-date';

type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

const box = cva('inline-block text-fg', {
  variants: {
    /** `plain`: no box (sits in a sidebar). `card`: its own border and padding. */
    variant: {
      plain: '',
      card: 'rounded-md border border-border bg-bg p-3',
    },
  },
  defaultVariants: { variant: 'plain' },
});

/** Props both calendars share. */
type CommonProps = {
  /** Names the calendar ("Delivery date"). Screen readers say it before the month. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Earliest day you can pick, `'YYYY-MM-DD'`. Earlier days are disabled: not focusable. */
  min?: string;
  /** Latest day you can pick, `'YYYY-MM-DD'`. */
  max?: string;
  /**
   * Days you can see and move to, but not pick: holidays, fully booked days. Shown
   * struck through. Called with each day as `'YYYY-MM-DD'`.
   */
  unavailable?: (iso: string) => boolean;
  /** Which day starts the week. Leave out to follow the user's language (en-US: Sunday). */
  firstDayOfWeek?: Weekday;
  /** @default 'md' */
  size?: CalendarSize;
  /** @default 'plain' */
  variant?: 'plain' | 'card';
  /** Read-only: you can move around but not change the value. @default false */
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Our ISO-text rule, wrapped for React Aria (which passes date objects). */
const unavailableFn = (fn?: (iso: string) => boolean) =>
  fn ? (date: DateValue) => fn(date.toString()) : undefined;

export type CalendarProps = CommonProps & {
  /** The chosen day, `'YYYY-MM-DD'` (controlled). `null` = none. */
  value?: string | null;
  /** Starting value when uncontrolled. */
  defaultValue?: string | null;
  /** Called with the picked day as `'YYYY-MM-DD'`. */
  onChange?: (value: string) => void;
};

/**
 * A month calendar on the page, not in a popover: a booking sidebar, a "pick a
 * delivery day" step. For a field that opens a calendar, use DatePicker.
 *
 * Built on React Aria's `Calendar`, a grid: arrows move by day, PageUp / PageDown by
 * month (Shift: year), Home / End to the week's ends, Enter or Space picks. The same
 * header and day grid as DatePicker's popover (`calendar-parts.tsx`).
 *
 * @example
 * <Calendar aria-label="Delivery date" value={day} onChange={setDay} min={today} />
 */
export function Calendar({
  value,
  defaultValue,
  onChange,
  min,
  max,
  unavailable,
  firstDayOfWeek,
  size = 'md',
  variant,
  readOnly = false,
  disabled = false,
  className,
  ...aria
}: CalendarProps) {
  return (
    <CalendarSizeContext.Provider value={size}>
      <AriaCalendar
        {...aria}
        // undefined = uncontrolled; null = controlled and empty. Keep the two apart.
        value={value === undefined ? undefined : toCalendarDate(value)}
        defaultValue={toCalendarDate(defaultValue)}
        onChange={(next) => onChange?.(next.toString())}
        minValue={toCalendarDate(min)}
        maxValue={toCalendarDate(max)}
        isDateUnavailable={unavailableFn(unavailable)}
        firstDayOfWeek={firstDayOfWeek}
        isReadOnly={readOnly}
        isDisabled={disabled}
        className={cn(box({ variant }), className)}
      >
        <MonthHeader />
        <DayGrid range={false} />
      </AriaCalendar>
    </CalendarSizeContext.Provider>
  );
}

export type RangeCalendarProps = CommonProps & {
  /** The chosen range, both ends included (controlled). `null` = none. */
  value?: IsoDateRange | null;
  /** Starting value when uncontrolled. */
  defaultValue?: IsoDateRange | null;
  /** Called once both ends are picked (not after the first click). */
  onChange?: (value: IsoDateRange) => void;
  /**
   * `2` shows two months side by side (one on screens under 40rem); ‹ › then move
   * two months. @default 1
   */
  visibleMonths?: 1 | 2;
};

/**
 * A range calendar on the page: first click (or Enter) sets the start, second the end.
 * Values are `{ start, end }` ISO strings, both ends included, like DateRangePicker.
 */
export function RangeCalendar({
  value,
  defaultValue,
  onChange,
  min,
  max,
  unavailable,
  firstDayOfWeek,
  size = 'md',
  variant,
  readOnly = false,
  disabled = false,
  visibleMonths = 1,
  className,
  ...aria
}: RangeCalendarProps) {
  const wide = useMediaQuery(WIDE_ENOUGH);
  const months = wide ? visibleMonths : 1;
  return (
    <CalendarSizeContext.Provider value={size}>
      <AriaRangeCalendar
        {...aria}
        value={value === undefined ? undefined : toCalendarRange(value)}
        defaultValue={toCalendarRange(defaultValue)}
        onChange={(next) =>
          onChange?.({
            start: next.start.toString(),
            end: next.end.toString(),
          })
        }
        minValue={toCalendarDate(min)}
        maxValue={toCalendarDate(max)}
        isDateUnavailable={unavailableFn(unavailable)}
        firstDayOfWeek={firstDayOfWeek}
        visibleDuration={{ months }}
        isReadOnly={readOnly}
        isDisabled={disabled}
        className={cn(box({ variant }), className)}
      >
        <MonthHeader />
        <div className="flex gap-4">
          {Array.from({ length: months }, (_, i) => (
            <DayGrid key={i} range offset={i} />
          ))}
        </div>
      </AriaRangeCalendar>
    </CalendarSizeContext.Provider>
  );
}
