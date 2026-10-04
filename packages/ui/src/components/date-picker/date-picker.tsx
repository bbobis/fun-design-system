import { parseDate, type CalendarDate } from '@internationalized/date';
import { cva, type VariantProps } from 'class-variance-authority';
import type { SVGProps } from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Popover,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';

// Same heights as Input / Select / Combobox. The Group is the box; the segments and the
// calendar button sit inside it.
const fieldVariants = cva(
  [
    'flex w-full min-w-0 items-center rounded-md border border-border-strong bg-bg text-fg',
    'transition-colors',
    // Ring while any segment is focused, by mouse too: it's a text-like field (same as Input).
    // outline-solid is explicit on purpose; see component-recipe.md (outline trap).
    'data-focus-within:outline-2 data-focus-within:outline-offset-2 data-focus-within:outline-solid data-focus-within:outline-focus-ring',
    'group-data-invalid:border-danger',
    'group-data-disabled:cursor-not-allowed group-data-disabled:bg-surface group-data-disabled:opacity-60',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 ps-2 text-sm',
        md: 'h-10 ps-2.5 text-sm',
        lg: 'h-12 ps-3.5 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

/** `'2026-10-04'` → CalendarDate, or null for empty / malformed text. */
function toCalendarDate(value: string | null | undefined): CalendarDate | null {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

export type DatePickerProps = VariantProps<typeof fieldVariants> & {
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
  /** Marks the control invalid. Inside a Field, set for you when it has an `error`. */
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** id of the date field. Inside a Field, the Field's control id. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
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
  invalid,
  required,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
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
      isInvalid={invalid ?? field?.invalid ?? false}
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
      <Group className={fieldVariants({ size })}>
        <DateInput className="flex flex-1 items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className={cn(
                'rounded px-0.5 tabular-nums caret-transparent outline-hidden',
                'focus:bg-primary focus:text-on-primary',
                'data-placeholder:text-fg-muted',
                'data-[type=literal]:px-0 data-[type=literal]:text-fg-muted',
              )}
            />
          )}
        </DateInput>
        <Button className="flex h-full shrink-0 items-center rounded-e-md px-2.5 text-fg-muted outline-hidden hover:text-fg data-focus-visible:text-fg data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring">
          <CalendarIcon className="size-4" />
        </Button>
      </Group>
      <Popover
        offset={4}
        className="rounded-md border border-border bg-bg p-3 text-fg shadow-lg"
      >
        <Dialog className="outline-hidden">
          <Calendar>
            <header className="mb-2 flex items-center justify-between gap-2">
              <Button slot="previous" className={navButton}>
                <ArrowIcon className="size-4 rotate-180" />
              </Button>
              <Heading className="text-sm font-medium" />
              <Button slot="next" className={navButton}>
                <ArrowIcon className="size-4" />
              </Button>
            </header>
            <CalendarGrid className="border-separate border-spacing-0.5">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="pb-1 text-xs font-medium text-fg-muted">
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={cn(
                      'flex size-9 cursor-default items-center justify-center rounded-md text-sm tabular-nums outline-hidden',
                      'hover:bg-surface data-outside-month:invisible',
                      'data-today:font-semibold data-today:underline data-today:underline-offset-4',
                      'data-selected:bg-primary data-selected:text-on-primary',
                      'data-disabled:cursor-not-allowed data-disabled:text-fg-muted data-disabled:opacity-40 data-disabled:hover:bg-transparent',
                      'data-unavailable:text-fg-muted data-unavailable:line-through',
                      'data-focus-visible:outline-2 data-focus-visible:outline-offset-1 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
                    )}
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}

const navButton =
  'flex size-8 items-center justify-center rounded-md text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-disabled:opacity-40 data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring';

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </svg>
  );
}

function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 4 4 4-4 4" />
    </svg>
  );
}
