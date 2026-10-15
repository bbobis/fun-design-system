import {
  getLocalTimeZone,
  isSameDay,
  type CalendarDate,
} from '@internationalized/date';
import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { Button } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';
import { chipTone, type CalendarEvent, type DayEntry } from './calendar-model';
import { layoutDay, toTimed } from './week-layout';

/** One hour's height. Blocks are placed in these units: 10:30 → 10.5 × 3rem. */
const HOUR_REM = 3;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const focusRing =
  'outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-offset-1 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring';

export type WeekViewProps = {
  /** The 7 days on screen, in the locale's week order. */
  days: readonly CalendarDate[];
  byDay: Map<string, DayEntry[]>;
  focusedDate: CalendarDate;
  today: CalendarDate;
  /** A day header or an event got focus, or a header was pressed. */
  onFocusDay: (date: CalendarDate) => void;
  onPickDay: (date: CalendarDate) => void;
  onEventAction?: (event: CalendarEvent) => void;
  formatTime: (hhmm: string) => string;
  locale: string;
  /** Scrolled into view when the week view opens. */
  scrollToHour: number;
};

/**
 * The week: day headers, an all-day row, then 24 hours with timed events as blocks.
 * React Aria has no week grid, so this is ours. Each event block is a real button,
 * which is fine here: unlike month cells, blocks are not inside a day button.
 * Tab order is all-day row, then each day's events by time.
 */
export function WeekView({
  days,
  byDay,
  focusedDate,
  today,
  onFocusDay,
  onPickDay,
  onEventAction,
  formatTime,
  locale,
  scrollToHour,
}: WeekViewProps) {
  const ids = useId();
  const headerId = (d: CalendarDate) => `${ids}-${d.toString()}`;
  const scroller = useRef<HTMLDivElement>(null);

  // Open on working hours instead of midnight.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = (scrollToHour / 24) * el.scrollHeight;
  }, [scrollToHour]);

  const fullDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [locale],
  );
  const weekday = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    [locale],
  );
  const hourLabel = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: 'numeric' }),
    [locale],
  );
  const asDate = (d: CalendarDate) => d.toDate(getLocalTimeZone());

  const columns = days.map((date) => {
    const entries = byDay.get(date.toString()) ?? [];
    const allDay = entries.filter((e) => e.days > 1 || !e.event.time);
    const timed = layoutDay(
      entries
        .filter((e) => e.days === 1 && e.event.time)
        .map((e) => toTimed(e.event, e.event.time, e.event.endTime))
        .filter((t) => t !== null),
    );
    return { date, allDay, timed };
  });

  const nowMinutes = (() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  })();
  const grid = 'grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]';

  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="min-w-[40rem]">
        {/* Day headers: buttons that pick the day for the day list. Visible "Thu 15";
            the name is the full date, like a month cell's. */}
        <div className={cn(grid, 'border-b border-border pb-1')}>
          <span />
          {days.map((date) => {
            const isToday = isSameDay(date, today);
            return (
              <Button
                key={date.toString()}
                id={headerId(date)}
                data-day={date.toString()}
                aria-label={fullDate.format(asDate(date))}
                aria-current={isToday ? 'date' : undefined}
                onFocus={() => onFocusDay(date)}
                onPress={() => onPickDay(date)}
                className={cn(
                  'flex items-baseline justify-center gap-1 rounded-md py-1 text-sm hover:bg-surface',
                  isSameDay(date, focusedDate) && 'bg-primary/10',
                  focusRing,
                )}
              >
                <span className="text-xs text-fg-muted">
                  {weekday.format(asDate(date))}
                </span>
                <span
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full tabular-nums',
                    isToday && 'bg-primary font-semibold text-on-primary',
                  )}
                >
                  {date.day}
                </span>
              </Button>
            );
          })}
        </div>

        {/* All-day and multi-day events. */}
        <div className={cn(grid, 'border-b border-border py-1')}>
          <span className="self-center pe-2 text-end text-xs text-fg-muted">
            All day
          </span>
          {columns.map(({ date, allDay }) => (
            <div
              key={date.toString()}
              className="flex min-w-0 flex-col gap-0.5 px-0.5"
            >
              {allDay.map((entry) => (
                <Button
                  key={entry.event.id}
                  aria-describedby={headerId(date)}
                  onFocus={() => onFocusDay(date)}
                  onPress={() => onEventAction?.(entry.event)}
                  className={cn(
                    'truncate px-1.5 py-px text-start text-xs',
                    entry.days === 1
                      ? 'rounded'
                      : entry.day === 1
                        ? 'rounded-s rounded-e-none -me-0.5'
                        : entry.day === entry.days
                          ? 'rounded-e rounded-s-none -ms-0.5'
                          : 'rounded-none -mx-0.5',
                    chipTone[entry.event.tone ?? 'neutral'],
                    focusRing,
                  )}
                >
                  {entry.event.title}
                </Button>
              ))}
            </div>
          ))}
        </div>

        {/* The hours. Scrolls on its own; it holds buttons, so it's reachable by Tab. */}
        <div ref={scroller} className="max-h-[32rem] overflow-y-auto">
          <div className={cn(grid, 'relative')}>
            <div aria-hidden="true">
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="h-12 pe-2 text-end text-xs leading-none text-fg-muted first:invisible"
                >
                  <span className="relative -top-1.5">
                    {hourLabel.format(new Date(2000, 0, 1, h))}
                  </span>
                </div>
              ))}
            </div>
            {columns.map(({ date, timed }) => (
              <div
                key={date.toString()}
                className="relative border-s border-border"
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    aria-hidden="true"
                    className="h-12 border-t border-border/60 first:border-t-0"
                  />
                ))}
                {timed.map((p) => {
                  const e = p.item;
                  // Under 45 minutes there's room for one line: "Standup 9:00 AM".
                  const short = p.end - p.start < 45;
                  return (
                    <Button
                      key={e.id}
                      aria-describedby={headerId(date)}
                      onFocus={() => onFocusDay(date)}
                      onPress={() => onEventAction?.(e)}
                      // Runtime numbers → CSS variables; Tailwind classes read them.
                      style={cssVars({
                        '--top': `${(p.start / 60) * HOUR_REM}rem`,
                        '--h': `${((p.end - p.start) / 60) * HOUR_REM}rem`,
                        '--lane': p.lane,
                        '--lanes': p.lanes,
                      })}
                      className={cn(
                        'absolute top-(--top) h-(--h) start-[calc(100%*var(--lane)/var(--lanes))] w-[calc(100%/var(--lanes))]',
                        // min-h-5: a 15-minute event still shows its title.
                        'flex min-h-5 overflow-hidden rounded border border-bg px-1.5 text-start text-xs',
                        short
                          ? 'flex-row items-center gap-1'
                          : 'flex-col py-0.5',
                        chipTone[e.tone ?? 'neutral'],
                        focusRing,
                        'data-focus-visible:z-10',
                      )}
                    >
                      <span className="min-w-0 truncate font-medium">
                        {e.title}
                      </span>
                      <span
                        className={cn(
                          'truncate tabular-nums',
                          short && 'shrink-0',
                        )}
                      >
                        {formatTime(e.time ?? '')}
                        {/* One line: start only, so the title keeps its room. */}
                        {!short && e.endTime && ` – ${formatTime(e.endTime)}`}
                      </span>
                    </Button>
                  );
                })}
                {isSameDay(date, today) && (
                  <div
                    aria-hidden="true"
                    style={cssVars({
                      '--top': `${(nowMinutes / 60) * HOUR_REM}rem`,
                    })}
                    className="pointer-events-none absolute inset-x-0 top-(--top) z-20 border-t-2 border-danger before:absolute before:-start-1 before:-top-1.5 before:size-2.5 before:rounded-full before:bg-danger"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
