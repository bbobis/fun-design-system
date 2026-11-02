import { getLocalTimeZone, today } from '@internationalized/date';
import { useContext, type ReactNode } from 'react';
import {
  Button,
  Calendar,
  DatePickerStateContext,
  DateRangePickerStateContext,
  Dialog,
  Popover,
  RangeCalendar,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { popoverMotion } from '../../utils/motion';
import { toCalendarRange } from './iso-date';
import type { RangePreset } from './range-presets';
import {
  CalendarSizeContext,
  DayGrid,
  headingSize,
  MonthHeader,
  useMediaQuery,
  WIDE_ENOUGH,
} from './calendar-parts';

// Older imports point here; the parts now live in calendar-parts.tsx.
export {
  CalendarIcon,
  CalendarSizeContext,
  type CalendarSize,
} from './calendar-parts';

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
