import type { VariantProps } from 'class-variance-authority';
import { DatePicker as AriaDatePicker, Group } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';
import { CalendarPopover, CalendarSizeContext } from './calendar-popover';
import {
  CalendarButton,
  DatePieces,
  dateFieldVariants,
} from './date-field-parts';
import { toCalendarDate } from './iso-date';

export type DatePickerProps = VariantProps<typeof dateFieldVariants> & {
  /**
   * The chosen day as an ISO date, `'YYYY-MM-DD'` (controlled). `null` = no date.
   * A plain string on purpose: a JS `Date` is a moment in time, so the same `Date`
   * can be a different day in another time zone. A calendar day has no time zone.
   */
  value?: string | null;
  /** Starting value when uncontrolled, `'YYYY-MM-DD'`. */
  defaultValue?: string | null;
  /** Called with `'YYYY-MM-DD'`, or `null` when the field is cleared. */
  onChange?: (value: string | null) => void;
  /** Earliest allowed day, `'YYYY-MM-DD'`. Earlier days are disabled in the calendar. */
  min?: string;
  /** Latest allowed day, `'YYYY-MM-DD'`. */
  max?: string;
  /** Called when focus leaves the control (React Hook Form uses this for "touched"). */
  onBlur?: () => void;
  /** Form field name. Posts `'YYYY-MM-DD'`. */
  name?: string;
  /**
   * Marks the control invalid. Inside a Field, set for you when it has an `error`.
   * Days outside `min`/`max` are marked invalid on their own.
   */
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** id of the date field. Inside a Field, the Field's control id. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /**
   * Adds a "Today" button under the calendar: picks today and closes. Disabled when
   * today is outside `min` / `max`. @default false
   */
  showToday?: boolean;
  /** Classes for the outer wrapper (width, margins). */
  className?: string;
};

/**
 * Pick a calendar day: type it (month / day / year pieces, in the user's locale order;
 * ↑↓ change a piece) or open the calendar with the button (or Alt+↓).
 *
 * Built on React Aria's `DatePicker`. The value is an ISO date string, so it round-trips
 * through JSON, forms and any backend without time-zone surprises.
 */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  onBlur,
  name,
  size,
  variant,
  invalid,
  required,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  showToday = false,
  className,
}: DatePickerProps) {
  const field = useFieldContext();
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;

  return (
    <AriaDatePicker
      // undefined = uncontrolled; null = controlled and empty. Keep the two apart.
      value={value === undefined ? undefined : toCalendarDate(value)}
      defaultValue={toCalendarDate(defaultValue)}
      onChange={(next) => onChange?.(next ? next.toString() : null)}
      minValue={toCalendarDate(min)}
      maxValue={toCalendarDate(max)}
      onBlur={onBlur}
      name={name}
      // true or undefined, never false: an explicit false would also switch off React
      // Aria's own checks (a typed day outside min/max, an end before the start).
      isInvalid={invalid || field?.invalid || undefined}
      isRequired={required ?? field?.required ?? false}
      isDisabled={disabled ?? field?.disabled ?? false}
      validationBehavior="aria"
      // Calendar days only: no time segments, even if a parsed value had one.
      granularity="day"
      id={id ?? field?.controlId}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <Group className={dateFieldVariants({ size, variant })}>
        <DatePieces className="flex-1" />
        <CalendarButton />
      </Group>
      {/* The calendar opens at the field's size (sm field, compact calendar). */}
      <CalendarSizeContext.Provider value={size ?? 'md'}>
        <CalendarPopover showToday={showToday} min={min} max={max} />
      </CalendarSizeContext.Provider>
    </AriaDatePicker>
  );
}
