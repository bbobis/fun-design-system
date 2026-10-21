import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Dialog } from '../dialog';
import { Field } from '../field';
import { Input } from '../input';
import { Switch } from '../switch';
import { TimeField } from '../time-field';
import { EventCalendar, type CalendarEvent } from './event-calendar';

const meta = {
  title: 'Components/EventCalendar',
  component: EventCalendar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Team calendar', events: [] },
} satisfies Meta<typeof EventCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

const team: CalendarEvent[] = [
  { id: 'a', date: '2026-10-01', title: 'Quarter kickoff', tone: 'info' },
  {
    id: 'b',
    date: '2026-10-05',
    time: '10:00',
    title: 'Team sync',
    tone: 'info',
  },
  { id: 'c', date: '2026-10-07', time: '14:30', title: 'Design review' },
  {
    id: 'd',
    date: '2026-10-12',
    time: '10:00',
    title: 'Team sync',
    tone: 'info',
  },
  { id: 'e', date: '2026-10-15', time: '09:00', title: 'Standup' },
  {
    id: 'f',
    date: '2026-10-15',
    time: '10:00',
    title: 'Team sync',
    tone: 'info',
  },
  { id: 'g', date: '2026-10-15', title: 'Invoice run', tone: 'warning' },
  {
    id: 'h',
    date: '2026-10-15',
    time: '16:00',
    title: 'Release 2.4',
    tone: 'success',
  },
  { id: 'i', date: '2026-10-15', time: '17:30', title: 'Retro' },
  { id: 'j', date: '2026-10-20', title: 'Payroll cut-off', tone: 'danger' },
  {
    id: 'k',
    date: '2026-10-22',
    time: '11:00',
    title: 'Customer demo',
    tone: 'success',
  },
  { id: 'l', date: '2026-10-29', time: '13:00', title: 'Planning' },
  {
    id: 'm',
    date: '2026-11-02',
    time: '10:00',
    title: 'Team sync',
    tone: 'info',
  },
];

/**
 * Click a day, or Tab into the grid and use the arrows (PageUp/PageDown for months).
 * The list on the right shows that day's events; Tab reaches them and Enter opens one.
 * Oct 15 has 5 events: the cell shows 3 and "+2 more", the list shows all.
 */
export const TeamCalendar: Story = {
  render: () => {
    function Example() {
      const [opened, setOpened] = useState<string | null>(null);
      return (
        <>
          <EventCalendar
            aria-label="Team calendar"
            events={team}
            defaultSelectedDate="2026-10-15"
            onEventAction={(e) => setOpened(e.title)}
          />
          <p role="status" className="mt-3 text-sm text-fg-muted">
            {opened ? `Opened: ${opened}` : 'No event opened yet.'}
          </p>
        </>
      );
    }
    return <Example />;
  },
};

/**
 * Controlled month: `onMonthChange` tells the app which month is on screen, so it can
 * load just that month's events (here a fake server answers after 300 ms).
 */
export const LoadPerMonth: Story = {
  render: () => {
    function Example() {
      const [month, setMonth] = useState('2026-10');
      const [events, setEvents] = useState(team);
      return (
        <>
          <p className="mb-3 text-sm text-fg-muted">
            month: <code>{month}</code> · {events.length} events loaded
          </p>
          <EventCalendar
            aria-label="Team calendar"
            events={events}
            month={month}
            onMonthChange={(m) => {
              setMonth(m);
              setTimeout(
                () => setEvents(team.filter((e) => e.date.startsWith(m))),
                300,
              );
            }}
          />
        </>
      );
    }
    return <Example />;
  },
};

/** A month with nothing in it: every day says "No events". */
export const Empty: Story = {
  args: { defaultSelectedDate: '2026-10-15' },
};

/**
 * In a narrow container (here 22rem), cells show coloured dots instead of chips and
 * the day list moves under the grid. This uses container queries, so it adapts to its
 * box, not the window.
 */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-[22rem]">
        <Story />
      </div>
    ),
  ],
  args: { events: team, defaultSelectedDate: '2026-10-15' },
};

/**
 * The app side of "create": a Dialog form (Input + Switch + TimeFields) that adds the
 * event to its own `events`. Shared by CreateEvents (month) and DragToCreate (week).
 */
function CreateEventsExample({
  initial,
  view,
}: {
  initial: CalendarEvent[];
  view: 'month' | 'week';
}) {
  const [events, setEvents] = useState(initial);
  const [creatingOn, setCreatingOn] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [time, setTime] = useState<string | null>('09:00');
  const [endTime, setEndTime] = useState<string | null>('09:30');
  const close = () => {
    setCreatingOn(null);
    setTitle('');
    setAllDay(false);
    setTime('09:00');
    setEndTime('09:30');
  };
  const save = () => {
    if (!creatingOn || !title.trim()) return;
    setEvents((list) => [
      ...list,
      {
        id: crypto.randomUUID(),
        date: creatingOn,
        title: title.trim(),
        time: allDay ? undefined : (time ?? undefined),
        endTime: allDay ? undefined : (endTime ?? undefined),
      },
    ]);
    close();
  };
  return (
    <>
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultView={view}
        defaultSelectedDate="2026-10-15"
        onCreateEvent={(date, range) => {
          // From a drag in week view the form starts with the picked times.
          if (range) {
            setTime(range.time);
            setEndTime(range.endTime);
          }
          setCreatingOn(date);
        }}
      />
      <Dialog
        open={creatingOn !== null}
        onOpenChange={(open) => !open && close()}
        title="New event"
        description={creatingOn ?? undefined}
        size="sm"
        footer={
          <>
            <Button intent="secondary" onClick={close}>
              Cancel
            </Button>
            <Button onClick={save} disabled={!title.trim()}>
              Save
            </Button>
          </>
        }
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Title" required>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Switch checked={allDay} onChange={setAllDay}>
            All day
          </Switch>
          {!allDay && (
            <div className="flex gap-3">
              <Field label="Starts at">
                <TimeField value={time} onChange={setTime} />
              </Field>
              <Field label="Ends at">
                <TimeField value={endTime} onChange={setEndTime} />
              </Field>
            </div>
          )}
        </form>
      </Dialog>
    </>
  );
}

/**
 * `onCreateEvent`: a "+ New event" button in the day list, and **N** on a focused day.
 * The calendar only says which day; the app opens its own form (Dialog + Input +
 * TimeField here) and adds the event. When the dialog closes, focus goes back to
 * where it was: the button, or the day you pressed N on.
 */
export const CreateEvents: Story = {
  render: () => <CreateEventsExample initial={team} view="month" />,
};

/**
 * Multi-day events: `endDate` (inclusive). The chip repeats on every day it covers,
 * with square corners where it carries on, and the day list says "Oct 26 – 30 ·
 * Day 2 of 5". Spans come first in each day, so they stay at the top.
 */
export const MultiDay: Story = {
  args: {
    defaultSelectedDate: '2026-10-15',
    events: [
      ...team.filter((e) => e.date !== '2026-10-15'),
      { id: 's', date: '2026-10-15', time: '09:00', title: 'Standup' },
      {
        id: 'o',
        date: '2026-10-14',
        endDate: '2026-10-16',
        title: 'Offsite',
        tone: 'success',
      },
      {
        id: 'v',
        date: '2026-10-26',
        endDate: '2026-10-30',
        title: 'Dana on vacation',
        tone: 'warning',
      },
      {
        id: 'c',
        date: '2026-10-31',
        endDate: '2026-11-02',
        title: 'Conference',
        tone: 'info',
      },
    ],
  },
};

const week: CalendarEvent[] = [
  {
    id: 'w1',
    date: '2026-10-12',
    time: '09:00',
    endTime: '09:15',
    title: 'Standup',
  },
  {
    id: 'w2',
    date: '2026-10-13',
    time: '09:00',
    endTime: '09:15',
    title: 'Standup',
  },
  {
    id: 'w3',
    date: '2026-10-13',
    time: '13:00',
    endTime: '15:00',
    title: 'Customer workshop',
    tone: 'success',
  },
  {
    id: 'w4',
    date: '2026-10-14',
    endDate: '2026-10-16',
    title: 'Offsite',
    tone: 'success',
  },
  {
    id: 'w5',
    date: '2026-10-15',
    time: '10:00',
    endTime: '11:00',
    title: 'Team sync',
    tone: 'info',
  },
  {
    id: 'w6',
    date: '2026-10-15',
    time: '10:30',
    endTime: '11:30',
    title: 'Design review',
  },
  {
    id: 'w7',
    date: '2026-10-15',
    time: '11:00',
    endTime: '12:00',
    title: 'Planning',
    tone: 'warning',
  },
  { id: 'w8', date: '2026-10-15', title: 'Invoice run', tone: 'warning' },
  {
    id: 'w9',
    date: '2026-10-16',
    time: '16:00',
    endTime: '17:00',
    title: 'Release 2.4',
    tone: 'success',
  },
  {
    id: 'w10',
    date: '2026-10-17',
    time: '08:30',
    title: 'Payroll check',
    tone: 'danger',
  },
];

/**
 * `view="week"`: 7 days × 24 hours, opened at 8 AM. Timed events are blocks from
 * `time` to `endTime` (30 minutes without one); overlapping ones share the width. On
 * Oct 15, Team sync, Design review and Planning form one group of 2 lanes (Planning
 * reuses Team sync's lane). All-day and multi-day events sit in the row on top. Every
 * block is a button: Tab through them, Enter opens one. Month | Week switches view.
 */
export const Week: Story = {
  render: () => {
    function Example() {
      const [opened, setOpened] = useState<string | null>(null);
      return (
        <>
          <EventCalendar
            aria-label="Team calendar"
            events={week}
            defaultView="week"
            defaultSelectedDate="2026-10-15"
            onEventAction={(e) => setOpened(e.title)}
            onCreateEvent={() => setOpened('(new event)')}
          />
          <p role="status" className="mt-3 text-sm text-fg-muted">
            {opened ? `Opened: ${opened}` : 'No event opened yet.'}
          </p>
        </>
      );
    }
    return <Example />;
  },
};

/**
 * `onEventChange`: drag a block to move it (snaps to 15 minutes; sideways for another
 * day), drag its bottom edge to change the end, Escape mid-drag to cancel. Keyboard:
 * Tab to a block, ↑/↓ = 15 minutes, ←/→ = a day, Shift+↑/↓ = the end. The calendar
 * only reports the change; this story saves it into its own `events` state.
 */
export const DragToReschedule: Story = {
  render: () => {
    function Example() {
      const [events, setEvents] = useState(week);
      const [last, setLast] = useState<string | null>(null);
      return (
        <>
          <EventCalendar
            aria-label="Team calendar"
            events={events}
            defaultView="week"
            defaultSelectedDate="2026-10-15"
            onEventChange={(event, change) => {
              setEvents((list) =>
                list.map((e) => (e.id === event.id ? { ...e, ...change } : e)),
              );
              setLast(
                `${event.title} → ${change.date} ${change.time}–${change.endTime}`,
              );
            }}
          />
          <p role="status" className="mt-3 text-sm text-fg-muted">
            {last ?? 'Nothing moved yet.'}
          </p>
        </>
      );
    }
    return <Example />;
  },
};

/**
 * `onCreateEvent` in week view: drag down (or up) on empty time to pick a range; it
 * snaps to 15 minutes and Escape cancels. A click picks 30 minutes. The second
 * argument, `{ time, endTime }`, pre-fills the form. A finger drag still scrolls the
 * hours, so on touch a tap is the way in. Keyboard: "+ New event" or N, as before.
 */
export const DragToCreate: Story = {
  render: () => <CreateEventsExample initial={week} view="week" />,
};
