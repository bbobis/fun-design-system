import {
  getLocalTimeZone,
  isSameDay,
  type CalendarDate,
} from '@internationalized/date';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMove } from 'react-aria/useMove';
import { Button, useLocale } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';
import { chipTone, type CalendarEvent, type DayEntry } from './calendar-model';
import {
  applyChange,
  fromMinutes,
  layoutDay,
  snap,
  SNAP_MINUTES,
  toTimed,
  type Change,
  type Placed,
} from './week-layout';

/** What `onEventChange` gets: the new day and times, ready to save. */
export type EventTimeChange = { date: string; time: string; endTime: string };

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
  /** Turns on drag/keyboard move and resize; see EventCalendar's `onEventChange`. */
  onEventChange?: (event: CalendarEvent, change: EventTimeChange) => void;
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
  onEventChange,
  formatTime,
  locale,
  scrollToHour,
}: WeekViewProps) {
  const ids = useId();
  const rtl = useLocale().direction === 'rtl';
  const root = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  // After a keyboard move to another day the block re-mounts in another column;
  // put focus back on it so the user can keep pressing arrows.
  const refocus = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = refocus.current;
    if (!id) return;
    refocus.current = null;
    root.current
      ?.querySelector<HTMLElement>(`[data-event-id="${CSS.escape(id)}"]`)
      ?.focus();
  });

  const commit = (
    p: Placed<CalendarEvent>,
    dayIndex: number,
    change: Change,
  ) => {
    const next = applyChange({ start: p.start, end: p.end, dayIndex }, change);
    const date = days[next.dayIndex];
    if (!date || !onEventChange) return;
    const time = fromMinutes(next.start);
    // '24:00' isn't a valid time of day; the last minute is.
    const endTime = next.end >= 24 * 60 ? '23:59' : fromMinutes(next.end);
    if (
      date.toString() === p.item.date &&
      time === p.item.time &&
      endTime === (p.item.endTime ?? fromMinutes(p.end))
    )
      return; // nothing changed (e.g. pushed against midnight)
    refocus.current = p.item.id;
    onEventChange(p.item, { date: date.toString(), time, endTime });
    setAnnouncement(
      `${p.item.title} moved to ${fullDate.format(asDate(date))}, ${formatTime(time)} – ${formatTime(endTime)}`,
    );
  };
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
    <div ref={root} className="min-w-0 overflow-x-auto">
      {onEventChange && (
        <>
          <span id={`${ids}-hint`} hidden>
            Arrow keys move the event by 15 minutes or a day. Shift plus up or
            down arrow changes its length.
          </span>
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
        </>
      )}
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
                {timed.map((p) => (
                  <EventBlock
                    key={p.item.id}
                    placed={p}
                    describedBy={
                      onEventChange
                        ? `${headerId(date)} ${ids}-hint`
                        : headerId(date)
                    }
                    rtl={rtl}
                    onFocus={() => onFocusDay(date)}
                    onAction={() => onEventAction?.(p.item)}
                    onCommit={
                      onEventChange
                        ? (change) => commit(p, days.indexOf(date), change)
                        : undefined
                    }
                    formatTime={formatTime}
                  />
                ))}
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

const NO_CHANGE: Change = { days: 0, move: 0, resize: 0 };

/**
 * One timed event in the week. A native <button> (not React Aria's Button): its press
 * handling and useMove would both claim the pointer, so one owner keeps it simple.
 *
 * With `onCommit`, React Aria `useMove` gives the same move events for mouse, touch
 * and arrow keys:
 * - drag the block (or ↑/↓, ←/→) to move it; drag the bottom strip (or Shift+↑/↓)
 *   to change its end. Pointer moves show a preview and save on release; each key
 *   press saves at once. Escape during a drag puts it back.
 */
function EventBlock({
  placed: p,
  describedBy,
  rtl,
  onFocus,
  onAction,
  onCommit,
  formatTime,
}: {
  placed: Placed<CalendarEvent>;
  describedBy: string;
  rtl: boolean;
  onFocus: () => void;
  onAction: () => void;
  onCommit?: (change: Change) => void;
  formatTime: (hhmm: string) => string;
}) {
  const e = p.item;
  const ref = useRef<HTMLButtonElement>(null);
  const [preview, setPreview] = useState<Change | null>(null);
  const drag = useRef({
    x: 0,
    y: 0,
    mode: 'move' as 'move' | 'resize',
    cancelled: false,
  });
  const swallowClick = useRef(false);

  /** Pixels so far → a change, snapped to 15 minutes and whole days. */
  const fromPixels = (): Change => {
    const column = ref.current?.parentElement?.getBoundingClientRect();
    if (!column) return NO_CHANGE;
    const minutes = snap((drag.current.y / column.height) * 24 * 60);
    if (drag.current.mode === 'resize')
      return { days: 0, move: 0, resize: minutes };
    const days = Math.round(drag.current.x / column.width) * (rtl ? -1 : 1);
    return { days, move: minutes, resize: 0 };
  };

  const handlers = (mode: 'move' | 'resize') => ({
    onMoveStart: () => {
      drag.current = { x: 0, y: 0, mode, cancelled: false };
    },
    onMove: (m: {
      pointerType: string;
      deltaX: number;
      deltaY: number;
      shiftKey: boolean;
    }) => {
      if (m.pointerType === 'keyboard') {
        // One key press = one step, saved now. Shift+↑/↓ resizes.
        const steps = m.deltaY * SNAP_MINUTES;
        onCommit?.(
          m.shiftKey
            ? { days: 0, move: 0, resize: steps }
            : { days: m.deltaX * (rtl ? -1 : 1), move: steps, resize: 0 },
        );
        return;
      }
      if (drag.current.cancelled) return;
      drag.current.x += m.deltaX;
      drag.current.y += m.deltaY;
      setPreview(fromPixels());
    },
    onMoveEnd: (m: { pointerType: string }) => {
      if (m.pointerType === 'keyboard') return;
      const change = fromPixels();
      setPreview(null);
      const moved = change.days || change.move || change.resize;
      if (moved) swallowClick.current = true; // the release isn't a click
      if (moved && !drag.current.cancelled) onCommit?.(change);
    },
  });
  // Escape cancels a pointer drag. Listen on the window: useMove keeps the button
  // from taking focus on pointer-down, so the key wouldn't reach it.
  const dragging = preview !== null;
  useEffect(() => {
    if (!dragging) return;
    const onKey = (k: KeyboardEvent) => {
      if (k.key !== 'Escape') return;
      drag.current.cancelled = true;
      setPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dragging]);
  const { moveProps } = useMove(handlers('move'));
  const { moveProps: resizeProps } = useMove(handlers('resize'));

  const shown = preview
    ? applyChange({ start: p.start, end: p.end, dayIndex: 0 }, preview)
    : p;
  const short = shown.end - shown.start < 45;
  const column = ref.current?.parentElement?.getBoundingClientRect();
  return (
    <button
      ref={ref}
      type="button"
      data-event-id={e.id}
      aria-describedby={describedBy}
      onFocus={onFocus}
      onClick={() => {
        if (swallowClick.current) {
          swallowClick.current = false;
          return;
        }
        onAction();
      }}
      {...(onCommit ? moveProps : {})}
      // Runtime numbers → CSS variables; Tailwind classes read them.
      style={cssVars({
        '--top': `${(shown.start / 60) * HOUR_REM}rem`,
        '--h': `${((shown.end - shown.start) / 60) * HOUR_REM}rem`,
        '--lane': preview ? 0 : p.lane,
        '--lanes': preview ? 1 : p.lanes,
        '--dx': `${(preview?.days ?? 0) * (column?.width ?? 0) * (rtl ? -1 : 1)}px`,
      })}
      className={cn(
        'absolute top-(--top) h-(--h) start-[calc(100%*var(--lane)/var(--lanes))] w-[calc(100%/var(--lanes))] translate-x-(--dx)',
        // min-h-5: a 15-minute event still shows its title.
        'flex min-h-5 overflow-hidden rounded border border-bg px-1.5 text-start text-xs',
        short ? 'flex-row items-center gap-1' : 'flex-col py-0.5',
        chipTone[e.tone ?? 'neutral'],
        'outline-hidden focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus-ring',
        onCommit && 'cursor-grab touch-none',
        preview && 'z-30 cursor-grabbing shadow-lg',
      )}
    >
      <span className="min-w-0 truncate font-medium">{e.title}</span>
      <span className={cn('truncate tabular-nums', short && 'shrink-0')}>
        {formatTime(fromMinutes(shown.start))}
        {/* One line: start only, so the title keeps its room. */}
        {!short &&
          (e.endTime || preview) &&
          ` – ${formatTime(fromMinutes(Math.min(shown.end, 24 * 60 - 1)))}`}
      </span>
      {onCommit && (
        // Bottom strip: drag to change the end. Not focusable (a control inside a
        // button isn't allowed); keyboard users have Shift+↑/↓ instead.
        <span
          aria-hidden="true"
          {...resizeProps}
          onPointerDown={(d) => {
            d.stopPropagation(); // don't also start a move on the button
            resizeProps.onPointerDown?.(d);
          }}
          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
        />
      )}
    </button>
  );
}
