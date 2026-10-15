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
 * `onCreateEvent`: a "+ New event" button in the day list, and **N** on a focused day.
 * The calendar only says which day; the app opens its own form (Dialog + Input +
 * TimeField here) and adds the event. When the dialog closes, focus goes back to
 * where it was: the button, or the day you pressed N on.
 */
export const CreateEvents: Story = {
  render: () => {
    function Example() {
      const [events, setEvents] = useState(team);
      const [creatingOn, setCreatingOn] = useState<string | null>(null);
      const [title, setTitle] = useState('');
      const [allDay, setAllDay] = useState(false);
      const [time, setTime] = useState<string | null>('09:00');
      const close = () => {
        setCreatingOn(null);
        setTitle('');
        setAllDay(false);
        setTime('09:00');
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
          },
        ]);
        close();
      };
      return (
        <>
          <EventCalendar
            aria-label="Team calendar"
            events={events}
            defaultSelectedDate="2026-10-15"
            onCreateEvent={setCreatingOn}
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
                <Field label="Starts at">
                  <TimeField value={time} onChange={setTime} />
                </Field>
              )}
            </form>
          </Dialog>
        </>
      );
    }
    return <Example />;
  },
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
