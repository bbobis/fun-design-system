import {
  parseDate,
  today,
  getLocalTimeZone,
  type CalendarDate,
} from '@internationalized/date';
import { useMemo, useState, type SVGProps } from 'react';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  useLocale,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Button as DsButton } from '../button';
import { toCalendarDate } from '../date-picker/iso-date';

/** Colour of an event, same names as Badge. Always pair it with a clear title. */
export type EventTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type CalendarEvent = {
  /** Unique, stable id. Passed back to `onEventAction`. */
  id: string;
  /** The day, `'YYYY-MM-DD'`. */
  date: string;
  /** Start time, `'HH:mm'` (24-hour, like TimeField). Leave out for all-day events. */
  time?: string;
  /** Short title shown in the day cell and the day list. */
  title: string;
  /** @default 'neutral' */
  tone?: EventTone;
};

export type EventCalendarProps = {
  /** Names the calendar for screen readers ("Team calendar"). Required. */
  'aria-label': string;
  /** The events to show. Only those in the visible weeks are drawn. */
  events: readonly CalendarEvent[];
  /** Called when an event is chosen in the day list (click, Enter or Space). */
  onEventAction?: (event: CalendarEvent) => void;
  /** The selected day, `'YYYY-MM-DD'` (controlled). `null` = none. */
  selectedDate?: string | null;
  /** Starting selected day when uncontrolled. */
  defaultSelectedDate?: string | null;
  /** Called with the day the user picked (click, Enter or Space on a day). */
  onSelectedDateChange?: (date: string) => void;
  /**
   * The month on screen, `'YYYY-MM'` (controlled). Pair with `onMonthChange`, for
   * example to load that month's events from the server.
   */
  month?: string;
  /** Called with `'YYYY-MM'` when the month on screen changes (‹ ›, Today, arrows, PageUp/Down). */
  onMonthChange?: (month: string) => void;
  /** Events shown in a day cell before "+N more". @default 3 */
  maxEventsPerDay?: number;
  /**
   * Turns on "create": a "+ New event" button in the day list, and the N key on a
   * focused day. Called with that day, `'YYYY-MM-DD'`; open your own form (a Dialog)
   * and add the event to `events`. The calendar never owns the form, because every app
   * wants different fields.
   */
  onCreateEvent?: (date: string) => void;
  className?: string;
};

const chipTone: Record<EventTone, string> = {
  neutral: 'bg-surface text-fg',
  info: 'bg-info-soft text-on-info-soft',
  success: 'bg-success-soft text-on-success-soft',
  warning: 'bg-warning-soft text-on-warning-soft',
  danger: 'bg-danger-soft text-on-danger-soft',
};
const dotTone: Record<EventTone, string> = {
  neutral: 'bg-fg-muted',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

/** `'2026-10-15'` → `'2026-10'`. */
const monthOf = (date: CalendarDate) => date.toString().slice(0, 7);

/**
 * A month of days with events in them, like Outlook's month view, and a list of the
 * focused day's events beside it (below it on narrow screens).
 *
 * Built on React Aria `Calendar`, so the grid is a real `grid`: ←/→/↑/↓ move by day
 * (and across months), PageUp/PageDown by month, Home/End to the week's ends. Tab
 * goes on to the day list, where each event is a button.
 *
 * Why events are buttons in the list and not in the cells: each day cell is already a
 * button, and a button inside a button is invalid and unreachable for screen readers.
 * So cells *show* events (up to `maxEventsPerDay`, then "+N more") and the list *acts*
 * on them. Moving between days updates the list and announces "3 events" politely.
 *
 * With `onCreateEvent`, the day list gets a "+ New event" button and N on a focused
 * day does the same. N only works while a day has focus (WCAG 2.1.4: a one-letter
 * shortcut must not fire while you type elsewhere).
 *
 * Not yet: events that span several days, week/day views, dragging events.
 *
 * @example
 * <EventCalendar aria-label="Team calendar" events={events}
 *   onEventAction={(e) => openEvent(e.id)} onMonthChange={loadMonth} />
 */
export function EventCalendar({
  'aria-label': ariaLabel,
  events,
  onEventAction,
  selectedDate,
  defaultSelectedDate,
  onSelectedDateChange,
  month,
  onMonthChange,
  maxEventsPerDay = 3,
  onCreateEvent,
  className,
}: EventCalendarProps) {
  const { locale } = useLocale();
  const now = useMemo(() => today(getLocalTimeZone()), []);
  const [focused, setFocused] = useState<CalendarDate>(
    () =>
      toCalendarDate(selectedDate ?? defaultSelectedDate) ??
      (month ? parseDate(`${month}-01`) : now),
  );
  // Controlled month: if the app says another month, show its first day.
  const focusedValue =
    month && monthOf(focused) !== month ? parseDate(`${month}-01`) : focused;

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    // All-day first, then by start time ('09:00' < '14:30' as text).
    for (const list of map.values())
      list.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
    return map;
  }, [events]);

  const timeFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
    [locale],
  );
  const formatTime = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return timeFormat.format(new Date(2000, 0, 1, h, m));
  };
  const dayTitle = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(focusedValue.toDate(getLocalTimeZone()));
  const dayEvents = byDay.get(focusedValue.toString()) ?? [];
  const monthTitle = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(focusedValue.toDate(getLocalTimeZone()));

  const moveTo = (date: CalendarDate) => {
    if (monthOf(date) !== monthOf(focusedValue)) onMonthChange?.(monthOf(date));
    setFocused(date);
  };

  return (
    <div
      className={cn('@container', className)}
      onKeyDown={(e) => {
        // N on a focused day = "New event". Only from a day cell, never from a
        // text field, and not with Ctrl/⌘/Alt (those are the browser's).
        if (
          onCreateEvent &&
          e.key.toLowerCase() === 'n' &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          (e.target as Element).closest('[role=gridcell]')
        ) {
          e.preventDefault();
          onCreateEvent(focusedValue.toString());
        }
      }}
    >
      <div className="grid gap-4 @min-[56rem]:grid-cols-[minmax(0,1fr)_16rem]">
        <Calendar
          aria-label={ariaLabel}
          value={
            selectedDate === undefined
              ? undefined
              : toCalendarDate(selectedDate)
          }
          defaultValue={toCalendarDate(defaultSelectedDate)}
          onChange={(d) => onSelectedDateChange?.(d.toString())}
          focusedValue={focusedValue}
          onFocusChange={moveTo}
          className="min-w-0"
        >
          <header className="mb-3 flex items-center gap-2">
            {/* Our own heading, not React Aria's <Heading>: that one puts the
                aria-label in front ("Team calendar, October 2026"). */}
            <h2 className="me-auto text-lg font-semibold">{monthTitle}</h2>
            <Button
              // slot={null}: inside a Calendar every Button is expected to be ‹ or ›;
              // null opts this one out of that context.
              slot={null}
              onPress={() => moveTo(now)}
              className={cn(
                navButton,
                'w-auto px-3 text-sm font-medium text-fg',
              )}
            >
              Today
            </Button>
            <Button slot="previous" className={navButton}>
              <ArrowIcon className="size-4 rotate-180 rtl:rotate-0" />
            </Button>
            <Button slot="next" className={navButton}>
              <ArrowIcon className="size-4 rtl:rotate-180" />
            </Button>
          </header>
          <CalendarGrid
            weekdayStyle="short"
            className="w-full table-fixed border-collapse"
          >
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="pb-2 text-start text-xs font-medium text-fg-muted">
                  {day}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => {
                const list = byDay.get(date.toString()) ?? [];
                const shown = list.slice(0, maxEventsPerDay);
                const more = list.length - shown.length;
                return (
                  <CalendarCell
                    date={date}
                    className={cn(
                      'flex h-14 cursor-default flex-col gap-0.5 overflow-hidden border border-border p-1 text-start outline-hidden @min-[40rem]:h-28',
                      'hover:bg-surface data-outside-month:bg-surface/50 data-outside-month:text-fg-muted',
                      'data-selected:bg-primary/10',
                      'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
                    )}
                  >
                    {({ formattedDate, isSelected }) => (
                      <>
                        <span
                          className={cn(
                            'flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums',
                            date.compare(now) === 0 &&
                              'bg-primary font-semibold text-on-primary',
                            isSelected &&
                              date.compare(now) !== 0 &&
                              'font-semibold',
                          )}
                        >
                          {formattedDate}
                        </span>
                        {/* Wide: chips with time + title. Narrow: a row of dots. Both
                            are decoration: the cell's name is the date, and the day
                            list reads the events out. */}
                        <span
                          aria-hidden="true"
                          className="hidden min-w-0 flex-col gap-0.5 @min-[40rem]:flex"
                        >
                          {shown.map((e) => (
                            <span
                              key={e.id}
                              className={cn(
                                'truncate rounded px-1.5 py-px text-xs',
                                chipTone[e.tone ?? 'neutral'],
                              )}
                            >
                              {e.time && (
                                <span className="me-1 font-medium tabular-nums">
                                  {formatTime(e.time)}
                                </span>
                              )}
                              {e.title}
                            </span>
                          ))}
                          {more > 0 && (
                            <span className="px-1.5 text-xs text-fg-muted">
                              +{more} more
                            </span>
                          )}
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex flex-wrap gap-0.5 px-1 @min-[40rem]:hidden"
                        >
                          {list.slice(0, 4).map((e) => (
                            <span
                              key={e.id}
                              className={cn(
                                'size-1.5 rounded-full',
                                dotTone[e.tone ?? 'neutral'],
                              )}
                            />
                          ))}
                        </span>
                      </>
                    )}
                  </CalendarCell>
                );
              }}
            </CalendarGridBody>
          </CalendarGrid>
        </Calendar>

        <section aria-label="Events on this day" className="min-w-0">
          {/* Polite live region: moving between days reads "Thursday, October 15, 3 events". */}
          <h3 aria-live="polite" className="mb-2 text-sm font-semibold">
            {dayTitle}
            <span className="ms-2 font-normal text-fg-muted">
              {dayEvents.length === 0
                ? 'No events'
                : dayEvents.length === 1
                  ? '1 event'
                  : `${dayEvents.length} events`}
            </span>
          </h3>
          {onCreateEvent && (
            <DsButton
              intent="secondary"
              size="sm"
              // "New event" first, so voice users can say what they see (WCAG 2.5.3).
              aria-label={`New event on ${dayTitle}`}
              aria-keyshortcuts="N"
              onClick={() => onCreateEvent(focusedValue.toString())}
              className="mb-2"
            >
              <PlusIcon className="size-4" />
              New event
            </DsButton>
          )}
          {dayEvents.length > 0 && (
            <ul className="flex flex-col gap-1">
              {dayEvents.map((e) => (
                <li key={e.id}>
                  <Button
                    onPress={() => onEventAction?.(e)}
                    className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-start text-sm outline-hidden hover:bg-surface data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'mt-1.5 size-2 shrink-0 rounded-full',
                        dotTone[e.tone ?? 'neutral'],
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {e.title}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {e.time ? formatTime(e.time) : 'All day'}
                      </span>
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

const navButton =
  'flex size-8 items-center justify-center rounded-md border border-border text-fg-muted outline-hidden hover:bg-surface hover:text-fg data-disabled:opacity-40 data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring';

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

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      {...props}
    >
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  );
}
