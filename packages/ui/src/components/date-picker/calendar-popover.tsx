import type { ReactNode, SVGProps } from 'react';
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
  RangeCalendar,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { popoverMotion } from '../../utils/motion';

/**
 * The calendar dropdown shared by DatePicker and the DataGrid's date cell editor.
 * Like ComboboxPopover, it takes no props: it reads the value, min/max and open state
 * from the surrounding React Aria `DatePicker` (through context).
 */
export function CalendarPopover() {
  return (
    <CalendarShell>
      <Calendar>
        <MonthHeader />
        <DayGrid range={false} />
      </Calendar>
    </CalendarShell>
  );
}

/**
 * The calendar dropdown for DateRangePicker. First click sets the start, second the end;
 * the start and end days are filled, the days between get a light band.
 */
export function RangeCalendarPopover() {
  return (
    <CalendarShell>
      <RangeCalendar>
        <MonthHeader />
        <DayGrid range />
      </RangeCalendar>
    </CalendarShell>
  );
}

function CalendarShell({ children }: { children: ReactNode }) {
  return (
    <Popover
      offset={4}
      className={cn(
        'rounded-md border border-border bg-bg p-3 text-fg shadow-lg',
        popoverMotion,
      )}
    >
      <Dialog className="outline-hidden">{children}</Dialog>
    </Popover>
  );
}

/** ‹ October 2026 ›. Works in both calendars: they share the slot names. */
function MonthHeader() {
  return (
    <header className="mb-2 flex items-center justify-between gap-2">
      <Button slot="previous" className={navButton}>
        <ArrowIcon className="size-4 rotate-180" />
      </Button>
      <Heading className="text-sm font-medium" />
      <Button slot="next" className={navButton}>
        <ArrowIcon className="size-4" />
      </Button>
    </header>
  );
}

function DayGrid({ range }: { range: boolean }) {
  return (
    // A range needs no gap between days, or the band between start and end breaks up.
    <CalendarGrid
      className={cn(
        'border-separate',
        range
          ? 'border-spacing-x-0 border-spacing-y-0.5'
          : 'border-spacing-0.5',
      )}
    >
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
              range
                ? [
                    // Days inside the range: a band. Square edges so they join up.
                    'data-selected:rounded-none data-selected:bg-primary/15 data-selected:hover:bg-primary/25',
                    // The two ends: filled, rounded on their outer side.
                    'data-selection-start:rounded-s-md data-selection-start:bg-primary data-selection-start:text-on-primary data-selection-start:hover:bg-primary',
                    'data-selection-end:rounded-e-md data-selection-end:bg-primary data-selection-end:text-on-primary data-selection-end:hover:bg-primary',
                  ]
                : 'data-selected:bg-primary data-selected:text-on-primary',
              'data-disabled:cursor-not-allowed data-disabled:text-fg-muted data-disabled:opacity-40 data-disabled:hover:bg-transparent',
              'data-unavailable:text-fg-muted data-unavailable:line-through',
              'data-focus-visible:outline-2 data-focus-visible:outline-offset-1 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
            )}
          />
        )}
      </CalendarGridBody>
    </CalendarGrid>
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
