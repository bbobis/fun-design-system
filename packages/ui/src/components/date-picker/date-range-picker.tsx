import type { VariantProps } from 'class-variance-authority';
import {
  DateRangePicker as AriaDateRangePicker,
  Group,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';
import { RangeCalendarPopover } from './calendar-popover';
import {
  CalendarButton,
  DatePieces,
  dateFieldVariants,
} from './date-field-parts';
import { toCalendarDate, toCalendarRange, type IsoDateRange } from './iso-date';
import type { RangePreset } from './range-presets';

export type DateRangePickerProps = VariantProps<typeof dateFieldVariants> & {
  /**
   * The chosen range, both ends included, as ISO dates:
   * `{ start: '2026-10-01', end: '2026-10-31' }` (controlled). `null` = no range.
   */
  value?: IsoDateRange | null;
  /** Starting value when uncontrolled. */
  defaultValue?: IsoDateRange | null;
  /**
   * Called with the new range once both ends are set (not after the first click in the
   * calendar), or `null` when the field is cleared.
   */
  onChange?: (value: IsoDateRange | null) => void;
  /** Earliest allowed day, `'YYYY-MM-DD'`. */
  min?: string;
  /** Latest allowed day, `'YYYY-MM-DD'`. */
  max?: string;
  /** Called when focus leaves the control (React Hook Form uses this for "touched"). */
  onBlur?: () => void;
  /** Form field name for the start date. Posts `'YYYY-MM-DD'`. */
  startName?: string;
  /** Form field name for the end date. Posts `'YYYY-MM-DD'`. */
  endName?: string;
  /**
   * Marks the control invalid. Inside a Field, set for you when it has an `error`.
   * Days outside `min`/`max` are marked invalid on their own.
   */
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** id of the control. Inside a Field, the Field's control id. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /**
   * Quick picks beside the calendar ("Last 7 days"). `commonRangePresets()` gives the
   * usual set; or pass your own `{ label, value: { start, end } }` list.
   */
  presets?: readonly RangePreset[];
  /** Classes for the outer wrapper (width, margins). */
  className?: string;
};

/**
 * Pick a start and an end day ("1 Oct – 31 Oct"): type both dates, or open the calendar
 * (button or Alt+↓), click the first day, then the last. Typing an end before the start
 * marks the field invalid.
 *
 * Built on React Aria's `DateRangePicker` + `RangeCalendar`. Like DatePicker, values are
 * ISO date strings, so they survive JSON, forms and time zones unchanged.
 *
 * @example
 * <Field label="Report period">
 *   <DateRangePicker value={period} onChange={setPeriod} presets={commonRangePresets()} />
 * </Field>
 * @example
 * <Field label="Report period">
 *   <DateRangePicker value={period} onChange={setPeriod} max={today} />
 * </Field>
 */
export function DateRangePicker({
  value,
  defaultValue,
  onChange,
  min,
  max,
  onBlur,
  startName,
  endName,
  size,
  invalid,
  required,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  presets,
  className,
}: DateRangePickerProps) {
  const field = useFieldContext();
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;

  return (
    <AriaDateRangePicker
      // undefined = uncontrolled; null = controlled and empty. Keep the two apart.
      value={value === undefined ? undefined : toCalendarRange(value)}
      defaultValue={toCalendarRange(defaultValue)}
      onChange={(next) =>
        onChange?.(
          next
            ? { start: next.start.toString(), end: next.end.toString() }
            : null,
        )
      }
      minValue={toCalendarDate(min)}
      maxValue={toCalendarDate(max)}
      onBlur={onBlur}
      startName={startName}
      endName={endName}
      // true or undefined, never false: an explicit false would also switch off React
      // Aria's own checks (a typed day outside min/max, an end before the start).
      isInvalid={invalid || field?.invalid || undefined}
      isRequired={required ?? field?.required ?? false}
      isDisabled={disabled ?? field?.disabled ?? false}
      validationBehavior="aria"
      granularity="day"
      id={id ?? field?.controlId}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <Group className={dateFieldVariants({ size })}>
        {/* React Aria names the two pieces "Start date" and "End date". */}
        <DatePieces slot="start" />
        <span aria-hidden="true" className="px-1.5 text-fg-muted">
          –
        </span>
        <DatePieces slot="end" />
        <CalendarButton />
      </Group>
      <RangeCalendarPopover presets={presets} min={min} max={max} />
    </AriaDateRangePicker>
  );
}
