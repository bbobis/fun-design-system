import {
  createContext,
  useContext,
  useSyncExternalStore,
  type SVGProps,
} from 'react';
import {
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

/*
 * The pieces every calendar in the library is built from: the month header (‹ Month ›)
 * and the day grid. Used by the DatePicker / DateRangePicker popovers and by the
 * standalone Calendar / RangeCalendar, so they all look and behave the same.
 */

export type CalendarSize = 'sm' | 'md' | 'lg';

/**
 * The field's size, handed down to its calendar so an `sm` field opens a compact
 * calendar and an `lg` field a roomy one. The pickers set it; the DataGrid's cell
 * editor doesn't, so it gets `md`. Context (not a prop) because the calendar parts
 * are a few levels down, inside React Aria's Popover.
 */
export const CalendarSizeContext = createContext<CalendarSize>('md');

/** Static class tables: Tailwind can only see class names written out in full. */
const cellSize: Record<CalendarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-10 text-base',
};
const navSize: Record<CalendarSize, string> = {
  sm: 'size-7',
  md: 'size-8',
  lg: 'size-9',
};
export const headingSize: Record<CalendarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/** Two months side by side need ~36rem; below `sm` (40rem) we show one. */
export const WIDE_ENOUGH = '(min-width: 40rem)';

/**
 * True when the media query matches, and re-renders when that changes.
 * `useSyncExternalStore` is React's hook for reading something that lives outside
 * React (here, the browser's media queries). The server snapshot is `true`.
 */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener('change', onChange);
      return () => list?.removeEventListener('change', onChange);
    },
    () => window.matchMedia?.(query).matches ?? true,
    () => true,
  );
}

/** ‹ October 2026 ›. Works in both calendars: they share the slot names. */
export function MonthHeader() {
  const size = useContext(CalendarSizeContext);
  return (
    <header className="mb-2 flex items-center justify-between gap-2">
      <Button slot="previous" className={cn(navButton, navSize[size])}>
        <ArrowIcon className="size-4 rotate-180" />
      </Button>
      <Heading className={cn('font-medium', headingSize[size])} />
      <Button slot="next" className={cn(navButton, navSize[size])}>
        <ArrowIcon className="size-4" />
      </Button>
    </header>
  );
}

export function DayGrid({
  range,
  offset = 0,
}: {
  range: boolean;
  offset?: number;
}) {
  const size = useContext(CalendarSizeContext);
  return (
    // A range needs no gap between days, or the band between start and end breaks up.
    <CalendarGrid
      offset={offset ? { months: offset } : undefined}
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
              'flex cursor-default items-center justify-center rounded-md tabular-nums outline-hidden',
              cellSize[size],
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
  'flex items-center justify-center rounded-md text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-disabled:opacity-40 data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring';

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
