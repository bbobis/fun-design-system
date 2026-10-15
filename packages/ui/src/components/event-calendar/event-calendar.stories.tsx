import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
