import {
  startOfWeek,
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
import { SegmentedControl } from '../segmented-control';
import { WeekView } from './week-view';
import {
  chipTone,
  dotTone,
  groupByDay,
  monthOf,
  type CalendarEvent,
  type DayEntry,
} from './calendar-model';

export {
  groupByDay,
  type CalendarEvent,
  type EventTone,
} from './calendar-model';

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
  /**
   * `'month'` (a grid of days) or `'week'` (7 days × 24 hours, events as blocks
   * placed by `time`–`endTime`). Controlled; pair with `onViewChange`. The header's
   * Month | Week switch calls it.
   */
  view?: CalendarView;
  /** Starting view when uncontrolled. @default 'month' */
  defaultView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  /** Week view: the hour scrolled into view when it opens. @default 8 */
  scrollToHour?: number;
  className?: string;
};

export type CalendarView = 'month' | 'week';

/**
 * Square the chip's corners on the side where the event carries on, and stretch it
 * over the cell's padding there (-ms-1 / -me-1), so the days read as one bar.
 */
const spanShape = ({ day, days }: DayEntry) =>
  days === 1
    ? 'rounded'
    : day === 1
      ? 'rounded-s rounded-e-none -me-1'
      : day === days
        ? 'rounded-e rounded-s-none -ms-1'
        : 'rounded-none -mx-1';

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
 * `view="week"` shows 7 days × 24 hours instead: timed events become blocks from
 * `time` to `endTime` (side by side when they overlap), all-day and multi-day events
 * sit in a row on top, and each block is a button. The header's Month | Week switch
 * changes the view; the day list, `onCreateEvent` and N work in both.
 *
 * Not yet: a day view, dragging events.
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
  view: viewProp,
  defaultView = 'month',
  onViewChange,
  scrollToHour = 8,
  className,
}: EventCalendarProps) {
  const [viewState, setViewState] = useState<CalendarView>(defaultView);
  const view = viewProp ?? viewState;
  const changeView = (next: CalendarView) => {
    setViewState(next);
    onViewChange?.(next);
  };
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

  const byDay = useMemo(() => groupByDay(events), [events]);
  const rangeFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
    [locale],
  );
  /** "Oct 14 – 16 · Day 2 of 3", "9:00 AM – 10:00 AM", "9:00 AM" or "All day". */
  const when = ({ event, day, days }: DayEntry) => {
    if (days === 1)
      return event.time
        ? event.endTime
          ? `${formatTime(event.time)} – ${formatTime(event.endTime)}`
          : formatTime(event.time)
        : 'All day';
    const start = parseDate(event.date);
    const range = rangeFormat.formatRange(
      start.toDate(getLocalTimeZone()),
      start.add({ days: days - 1 }).toDate(getLocalTimeZone()),
    );
    return `${range} · Day ${day} of ${days}`;
  };

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

  const weekStart = startOfWeek(focusedValue, locale);
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    weekStart.add({ days: i }),
  );
  const weekTitle = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).formatRange(
    weekStart.toDate(getLocalTimeZone()),
    weekStart.add({ days: 6 }).toDate(getLocalTimeZone()),
  );
  const viewSwitch = (
    <SegmentedControl
      aria-label="View"
      size="sm"
      options={[
        { id: 'month', label: 'Month' },
        { id: 'week', label: 'Week' },
      ]}
      value={view}
      onChange={(id) => changeView(id as CalendarView)}
    />
  );

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
          (e.target as Element).closest('[role=gridcell], [data-day]')
        ) {
          e.preventDefault();
          onCreateEvent(focusedValue.toString());
        }
      }}
    >
      <div className="grid gap-4 @min-[56rem]:grid-cols-[minmax(0,1fr)_16rem]">
        {view === 'week' ? (
          <section aria-label={ariaLabel} className="min-w-0">
            <header className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="me-auto text-lg font-semibold">{weekTitle}</h2>
              {viewSwitch}
              <Button
                onPress={() => moveTo(now)}
                className={cn(
                  navButton,
                  'w-auto px-3 text-sm font-medium text-fg',
                )}
              >
                Today
              </Button>
              <Button
                aria-label="Previous week"
                onPress={() => moveTo(focusedValue.subtract({ weeks: 1 }))}
                className={navButton}
              >
                <ArrowIcon className="size-4 rotate-180 rtl:rotate-0" />
              </Button>
              <Button
                aria-label="Next week"
                onPress={() => moveTo(focusedValue.add({ weeks: 1 }))}
                className={navButton}
              >
                <ArrowIcon className="size-4 rtl:rotate-180" />
              </Button>
            </header>
            <WeekView
              days={weekDays}
              byDay={byDay}
              focusedDate={focusedValue}
              today={now}
              onFocusDay={moveTo}
              onPickDay={(d) => {
                moveTo(d);
                onSelectedDateChange?.(d.toString());
              }}
              onEventAction={onEventAction}
              formatTime={formatTime}
              locale={locale}
              scrollToHour={scrollToHour}
            />
          </section>
        ) : (
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
              {viewSwitch}
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
                            {shown.map((entry) => {
                              const e = entry.event;
                              return (
                                <span
                                  key={e.id}
                                  className={cn(
                                    'truncate px-1.5 py-px text-xs',
                                    spanShape(entry),
                                    chipTone[e.tone ?? 'neutral'],
                                  )}
                                >
                                  {e.time && entry.day === 1 && (
                                    <span className="me-1 font-medium tabular-nums">
                                      {formatTime(e.time)}
                                    </span>
                                  )}
                                  {e.title}
                                </span>
                              );
                            })}
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
                            {list.slice(0, 4).map(({ event: e }) => (
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
        )}

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
              {dayEvents.map((entry) => {
                const e = entry.event;
                return (
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
                          {when(entry)}
                        </span>
                      </span>
                    </Button>
                  </li>
                );
              })}
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
