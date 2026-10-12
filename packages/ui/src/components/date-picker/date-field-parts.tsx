import { cva } from 'class-variance-authority';
import { Button, DateInput, DateSegment } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { CalendarIcon } from './calendar-popover';

/**
 * The box around the date pieces, shared by DatePicker and DateRangePicker. Same
 * heights as Input / Select / Combobox. It's put on React Aria's `Group`.
 */
export const dateFieldVariants = cva(
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

/**
 * The typed month / day / year pieces. `slot` picks which date it edits inside a
 * DateRangePicker ('start' or 'end'); leave it out in a DatePicker.
 */
export function DatePieces({
  slot,
  className,
}: {
  slot?: 'start' | 'end';
  className?: string;
}) {
  return (
    <DateInput slot={slot} className={cn('flex items-center', className)}>
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
  );
}

/** The 📅 button at the end of the field. React Aria names it ("Calendar") and wires it. */
export function CalendarButton() {
  return (
    <Button className="ms-auto flex h-full shrink-0 items-center rounded-e-md px-2.5 text-fg-muted outline-hidden hover:text-fg data-focus-visible:text-fg data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring">
      <CalendarIcon className="size-4" />
    </Button>
  );
}
