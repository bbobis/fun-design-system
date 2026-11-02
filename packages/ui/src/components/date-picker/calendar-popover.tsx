import { getLocalTimeZone, today } from '@internationalized/date';
import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
  type SVGProps,
} from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateRangePickerStateContext,
  DatePickerStateContext,
  Dialog,
  Heading,
  Popover,
  RangeCalendar,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { popoverMotion } from '../../utils/motion';
import { toCalendarRange } from './iso-date';
import type { RangePreset } from './range-presets';

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
const headingSize: Record<CalendarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * The calendar dropdown shared by DatePicker and the DataGrid's date cell editor.
 * It reads the value and open state from the surrounding React Aria `DatePicker`
 * (through context). With `showToday`, a "Today" button sits under the days.
 */
export function CalendarPopover({
  showToday = false,
  min,
  max,
}: {
  /** Adds a "Today" button that picks today and closes. */
  showToday?: boolean;
  /** Only used to disable "Today" when today is outside the range. */
  min?: string;
  max?: string;
}) {
  return (
    <CalendarShell>
      <Calendar>
        <MonthHeader />
        <DayGrid range={false} />
      </Calendar>
      {showToday && <TodayButton min={min} max={max} />}
    </CalendarShell>
  );
}

/** Picks today and closes. Disabled when today is outside min / max. */
function TodayButton({ min, max }: { min?: string; max?: string }) {
  const state = useContext(DatePickerStateContext);
  const size = useContext(CalendarSizeContext);
  const now = today(getLocalTimeZone());
  const iso = now.toString();
  // ISO strings compare like dates.
  const outside =
    (min !== undefined && iso < min) || (max !== undefined && iso > max);
  return (
    <div className="mt-2 flex justify-end border-t border-border pt-2">
      <Button
        isDisabled={outside}
        onPress={() => {
          if (!state) return;
          state.setValue(now);
          state.setOpen(false);
        }}
        className={cn(
          'rounded-md px-2.5 py-1 font-medium text-link outline-hidden hover:bg-surface',
          headingSize[size],
          'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:hover:bg-transparent',
          'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        )}
      >
        Today
      </Button>
    </div>
  );
}

/** Two months side by side need ~36rem; below `sm` (40rem) we show one. */
const WIDE_ENOUGH = '(min-width: 40rem)';

/**
 * True when the media query matches, and re-renders when that changes.
 * `useSyncExternalStore` is React's hook for reading something that lives outside
 * React (here, the browser's media queries). The server snapshot is `true`.
 */
function useMediaQuery(query: string) {
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

/**
 * The calendar dropdown for DateRangePicker. First click sets the start, second the end;
 * the start and end days are filled, the days between get a light band. With `presets`,
 * a column of quick picks sits before the calendar.
 */
export function RangeCalendarPopover({
  presets,
  min,
  max,
  visibleMonths = 1,
}: {
  presets?: readonly RangePreset[];
  min?: string;
  max?: string;
  /** 2 = two months side by side (one on narrow screens). */
  visibleMonths?: 1 | 2;
}) {
  const wide = useMediaQuery(WIDE_ENOUGH);
  const months = wide ? visibleMonths : 1;
  return (
    <CalendarShell>
      <div className="flex gap-3">
        {presets && presets.length > 0 && (
          <PresetList presets={presets} min={min} max={max} />
        )}
        {/* visibleDuration: how many months one "page" holds. ‹ › move a whole page. */}
        <RangeCalendar visibleDuration={{ months }}>
          <MonthHeader />
          <div className="flex gap-4">
            {Array.from({ length: months }, (_, i) => (
              // offset: which month of the page this grid draws (0 = first).
              <DayGrid key={i} range offset={i} />
            ))}
          </div>
        </RangeCalendar>
      </div>
    </CalendarShell>
  );
}

/**
 * Quick picks. Plain buttons (Tab reaches them; Shift+Tab from the calendar), each
 * marked pressed when it matches the current range, and disabled when the range
 * reaches outside min / max. Picking one sets the whole range and closes the popover.
 */
function PresetList({
  presets,
  min,
  max,
}: {
  presets: readonly RangePreset[];
  min?: string;
  max?: string;
}) {
  // The picker's own state, from React Aria (the same one the calendar uses).
  const state = useContext(DateRangePickerStateContext);
  const current = state?.value;
  return (
    <div
      role="group"
      aria-label="Quick picks"
      className="flex min-w-32 flex-col gap-0.5 border-e border-border pe-3"
    >
      {presets.map((preset) => {
        const range = toCalendarRange(preset.value);
        // ISO strings compare like dates ('2026-09-30' < '2026-10-01').
        const outside =
          !range ||
          (min !== undefined && preset.value.start < min) ||
          (max !== undefined && preset.value.end > max);
        const pressed =
          current?.start?.toString() === preset.value.start &&
          current?.end?.toString() === preset.value.end;
        return (
          <Button
            key={preset.label}
            aria-pressed={pressed}
            isDisabled={outside}
            onPress={() => {
              if (!range || !state) return;
              state.setValue(range);
              state.setOpen(false);
            }}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-start text-sm text-fg outline-hidden hover:bg-surface',
              'aria-pressed:bg-primary/15 aria-pressed:font-medium',
              'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:hover:bg-transparent',
              'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
            )}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
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

function DayGrid({ range, offset = 0 }: { range: boolean; offset?: number }) {
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
