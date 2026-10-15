import type { VariantProps } from 'class-variance-authority';
import { useState, type SVGProps } from 'react';
import { Group, TimeField as AriaTimeField } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { DatePieces, dateFieldVariants } from '../date-picker/date-field-parts';
import { useFieldContext } from '../field/field-context';
import { fromTime, toTime, type TimeGranularity } from './iso-time';

export type TimeFieldProps = VariantProps<typeof dateFieldVariants> & {
  /**
   * The time as 24-hour text, `'HH:mm'` (or `'HH:mm:ss'` with `granularity="second"`),
   * controlled. `null` = empty. Text on purpose: a time of day ("opens at 09:00") has
   * no date and no time zone, so a JS `Date` would invent both. Maps straight to a
   * Java `LocalTime`.
   */
  value?: string | null;
  /** Starting value when uncontrolled, `'HH:mm'`. */
  defaultValue?: string | null;
  /** Called with `'HH:mm'` (or `'HH:mm:ss'`), or `null` when a piece is cleared. */
  onChange?: (value: string | null) => void;
  /** Earliest allowed time, `'HH:mm'`. Earlier times are marked invalid. */
  min?: string;
  /** Latest allowed time, `'HH:mm'`. */
  max?: string;
  /** `'second'` adds a seconds piece. @default 'minute' */
  granularity?: TimeGranularity;
  /**
   * 12-hour (with AM/PM) or 24-hour display. Only changes what's shown: the value is
   * always 24-hour text. Leave it out to follow the user's language (en-US: 12, fr: 24).
   */
  hourCycle?: 12 | 24;
  /** Called when focus leaves the control (React Hook Form uses this for "touched"). */
  onBlur?: () => void;
  /** Form field name. Posts the same `'HH:mm'` text as `onChange`. */
  name?: string;
  /**
   * Marks the control invalid. Inside a Field, set for you when it has an `error`.
   * Times outside `min`/`max` are marked invalid on their own.
   */
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** id of the time field. Inside a Field, the Field's control id. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Classes for the outer wrapper (width, margins). */
  className?: string;
};

/**
 * Type a time of day: hour / minute (/ second) pieces, plus AM/PM in 12-hour locales.
 * Tab or → moves between pieces, ↑/↓ change one, typing digits fills it and moves on.
 * Each piece spins on its own, like the browser's time input: ↑ on the hour at
 * 11:30 AM gives 12:30 **AM** (00:30), not PM. AM/PM is its own piece.
 * Pair it with DatePicker for "date and time": they share the same box and pieces.
 *
 * Built on React Aria `TimeField`; each piece is a `spinbutton`, so screen readers
 * say "hour, 2, spin button".
 *
 * @example
 * <Field label="Start time">
 *   <TimeField value={time} onChange={setTime} min="08:00" max="18:00" />
 * </Field>
 */
export function TimeField({
  value,
  defaultValue,
  onChange,
  min,
  max,
  granularity = 'minute',
  hourCycle,
  onBlur,
  name,
  size,
  invalid,
  required,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
}: TimeFieldProps) {
  const field = useFieldContext();
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;
  // Only for the form post when uncontrolled: React Aria would post '14:30:00'
  // (its own format); we post the same text onChange gives you.
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? null);
  const current = value === undefined ? uncontrolled : value;

  return (
    <AriaTimeField
      // undefined = uncontrolled; null = controlled and empty. Keep the two apart.
      value={value === undefined ? undefined : toTime(value)}
      defaultValue={toTime(defaultValue)}
      onChange={(next) => {
        const text = next ? fromTime(next, granularity) : null;
        setUncontrolled(text);
        onChange?.(text);
      }}
      minValue={toTime(min)}
      maxValue={toTime(max)}
      granularity={granularity}
      hourCycle={hourCycle}
      onBlur={onBlur}
      // true or undefined, never false: an explicit false would also switch off React
      // Aria's own min/max check.
      isInvalid={invalid || field?.invalid || undefined}
      isRequired={required ?? field?.required ?? false}
      isDisabled={disabled ?? field?.disabled ?? false}
      validationBehavior="aria"
      id={id ?? field?.controlId}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <Group className={cn(dateFieldVariants({ size }), 'pe-2.5')}>
        <DatePieces className="flex-1" />
        <ClockIcon className="size-4 shrink-0 text-fg-muted" />
      </Group>
      {name && <input type="hidden" name={name} value={current ?? ''} />}
    </AriaTimeField>
  );
}

function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      {...props}
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75V8l2.25 1.5" />
    </svg>
  );
}
