import type { SVGProps } from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Dialog,
  Heading,
  Popover,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

/**
 * The calendar dropdown shared by DatePicker and the DataGrid's date cell editor.
 * Like ComboboxPopover, it takes no props: it reads the value, min/max and open state
 * from the surrounding React Aria `DatePicker` (through context).
 */
export function CalendarPopover() {
  return (
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
  );
}

const navButton =
  'flex size-8 items-center justify-center rounded-md text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-disabled:opacity-40 data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring';

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

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
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
