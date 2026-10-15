import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Dialog } from '../dialog';
import {
  EventCalendar,
  groupByDay,
  type CalendarEvent,
} from './event-calendar';

const events: CalendarEvent[] = [
  {
    id: '1',
    date: '2026-10-15',
    time: '10:00',
    title: 'Team sync',
    tone: 'info',
  },
  { id: '2', date: '2026-10-15', title: 'Invoice run', tone: 'warning' },
  { id: '3', date: '2026-10-15', time: '09:00', title: 'Standup' },
  { id: '4', date: '2026-10-15', time: '16:00', title: 'Release' },
  { id: '5', date: '2026-10-29', time: '13:00', title: 'Planning' },
];

/** The day cell React Aria names by its full date. */
const day = (label: RegExp) => screen.getByRole('button', { name: label });
const dayList = () =>
  screen.getByRole('region', { name: 'Events on this day' });
const listed = () =>
  within(dayList())
    .queryAllByRole('button')
    .map((b) => b.textContent);

describe('EventCalendar', () => {
  it('is a named grid of days with the month as its heading', () => {
    render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultSelectedDate="2026-10-15"
      />,
    );
    expect(screen.getByRole('grid')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeTruthy();
    expect(
      screen.getByRole('application', { name: /Team calendar/ }),
    ).toBeTruthy();
  });

  it('a day cell shows up to maxEventsPerDay chips, then "+N more"', () => {
    render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultSelectedDate="2026-10-15"
        maxEventsPerDay={2}
      />,
    );
    const cell = day(/October 15, 2026/);
    expect(cell.textContent).toContain('Invoice run'); // all-day first
    expect(cell.textContent).toContain('Standup');
    expect(cell.textContent).not.toContain('Team sync');
    expect(cell.textContent).toContain('+2 more');
  });

  it('the day list shows all of the focused day’s events: all-day first, then by time', () => {
    render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultSelectedDate="2026-10-15"
      />,
    );
    expect(listed()).toEqual([
      'Invoice runAll day',
      'Standup9:00 AM',
      'Team sync10:00 AM',
      'Release4:00 PM',
    ]);
    expect(within(dayList()).getByRole('heading').textContent).toBe(
      'Thursday, October 154 events',
    );
  });

  it('choosing an event in the list calls onEventAction with it', async () => {
    const user = userEvent.setup();
    const onEventAction = vi.fn();
    render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultSelectedDate="2026-10-15"
        onEventAction={onEventAction}
      />,
    );
    await user.click(
      within(dayList()).getByRole('button', { name: /Release/ }),
    );
    expect(onEventAction).toHaveBeenCalledWith(events[3]);
  });

  it('clicking a day selects it and the list follows', async () => {
    const user = userEvent.setup();
    const onSelectedDateChange = vi.fn();
    render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultSelectedDate="2026-10-15"
        onSelectedDateChange={onSelectedDateChange}
      />,
    );
    await user.click(day(/October 29, 2026/));
    expect(onSelectedDateChange).toHaveBeenLastCalledWith('2026-10-29');
    expect(listed()).toEqual(['Planning1:00 PM']);
  });

  it('↓ on Oct 29 goes to Nov 5 and the month turns (the prediction)', () => {
    const onMonthChange = vi.fn();
    render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultSelectedDate="2026-10-29"
        onMonthChange={onMonthChange}
      />,
    );
    act(() => day(/October 29, 2026/).focus());
    act(() => {
      day(/October 29, 2026/).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(day(/November 5, 2026/));
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-11');
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeTruthy();
    expect(within(dayList()).getByRole('heading').textContent).toBe(
      'Thursday, November 5No events',
    );
  });

  it('controlled month: shows the month the app says', () => {
    const { rerender } = render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        month="2026-10"
      />,
    );
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeTruthy();
    rerender(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        month="2027-02"
      />,
    );
    expect(screen.getByRole('heading', { name: 'February 2027' })).toBeTruthy();
  });

  it('‹ › change the month and report it', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <EventCalendar
        aria-label="Team calendar"
        events={events}
        defaultSelectedDate="2026-10-15"
        onMonthChange={onMonthChange}
      />,
    );
    // [0]: React Aria also adds hidden ‹ › at the end of the grid for screen readers.
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]!);
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-11');
    expect(screen.getByRole('heading', { name: 'November 2026' })).toBeTruthy();
  });

  describe('onCreateEvent', () => {
    it('off by default: no "New event" button', () => {
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={events}
          defaultSelectedDate="2026-10-15"
        />,
      );
      expect(screen.queryByRole('button', { name: /New event/ })).toBeNull();
    });

    it('the button is named with the day and reports it', async () => {
      const user = userEvent.setup();
      const onCreateEvent = vi.fn();
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={events}
          defaultSelectedDate="2026-10-15"
          onCreateEvent={onCreateEvent}
        />,
      );
      const button = screen.getByRole('button', {
        name: 'New event on Thursday, October 15',
      });
      expect(button.getAttribute('aria-keyshortcuts')).toBe('N');
      await user.click(button);
      expect(onCreateEvent).toHaveBeenCalledWith('2026-10-15');
    });

    it('N on a focused day creates on that day; Ctrl+N and N elsewhere do nothing', async () => {
      const user = userEvent.setup();
      const onCreateEvent = vi.fn();
      render(
        <>
          <input aria-label="Search" />
          <EventCalendar
            aria-label="Team calendar"
            events={events}
            defaultSelectedDate="2026-10-29"
            onCreateEvent={onCreateEvent}
          />
        </>,
      );
      await user.click(screen.getByRole('textbox', { name: 'Search' }));
      await user.keyboard('n');
      expect(onCreateEvent).not.toHaveBeenCalled();
      act(() => day(/October 29, 2026/).focus());
      await user.keyboard('{Control>}n{/Control}');
      expect(onCreateEvent).not.toHaveBeenCalled();
      await user.keyboard('n');
      expect(onCreateEvent).toHaveBeenCalledWith('2026-10-29');
    });

    it('after the form closes, focus is back on the day N was pressed on (the prediction)', async () => {
      const user = userEvent.setup();
      function WithForm() {
        const [on, setOn] = useState<string | null>(null);
        return (
          <>
            <EventCalendar
              aria-label="Team calendar"
              events={events}
              defaultSelectedDate="2026-10-22"
              onCreateEvent={setOn}
            />
            <Dialog
              open={on !== null}
              onOpenChange={() => setOn(null)}
              title="New event"
            >
              <input aria-label="Title" />
            </Dialog>
          </>
        );
      }
      render(<WithForm />);
      act(() => day(/October 22, 2026/).focus());
      await user.keyboard('n');
      expect(screen.getByRole('dialog', { name: 'New event' })).toBeTruthy();
      await user.keyboard('{Escape}');
      await act(
        () => new Promise((r) => requestAnimationFrame(() => r(undefined))),
      );
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(document.activeElement).toBe(day(/October 22, 2026/));
    });
  });

  describe('multi-day events (endDate)', () => {
    const offsite: CalendarEvent = {
      id: 'o',
      date: '2026-10-14',
      endDate: '2026-10-16',
      title: 'Offsite',
      tone: 'success',
    };
    const standup: CalendarEvent = {
      id: 's',
      date: '2026-10-15',
      time: '09:00',
      title: 'Standup',
    };

    it('groupByDay: one entry per covered day, with "day N of M"', () => {
      const map = groupByDay([offsite]);
      expect([...map.keys()]).toEqual([
        '2026-10-14',
        '2026-10-15',
        '2026-10-16',
      ]);
      expect(
        map.get('2026-10-15')?.map(({ day, days }) => [day, days]),
      ).toEqual([[2, 3]]);
    });

    it('groupByDay: spans first, then all-day, then by time (the prediction)', () => {
      const allDay: CalendarEvent = {
        id: 'a',
        date: '2026-10-15',
        title: 'Invoice run',
      };
      const order = groupByDay([standup, allDay, offsite])
        .get('2026-10-15')
        ?.map(({ event }) => event.title);
      expect(order).toEqual(['Offsite', 'Invoice run', 'Standup']);
    });

    it('groupByDay: an end before the start, or malformed, means one day; spans are capped', () => {
      const back = { ...offsite, endDate: '2026-10-01' };
      const junk = { ...offsite, id: 'j', endDate: 'soon' };
      expect([...groupByDay([back]).keys()]).toEqual(['2026-10-14']);
      expect([...groupByDay([junk]).keys()]).toEqual(['2026-10-14']);
      const typo = { ...offsite, endDate: '2062-10-16' };
      expect(groupByDay([typo]).size).toBe(366);
    });

    it('shows on every day it covers; edges are square where it carries on', () => {
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={[offsite, standup]}
          defaultSelectedDate="2026-10-15"
        />,
      );
      const chip = (label: RegExp) =>
        [...day(label).querySelectorAll('span.truncate')].find(
          (s) => s.textContent === 'Offsite',
        );
      expect(chip(/October 14, 2026/)?.className).toContain('rounded-e-none');
      expect(chip(/October 15, 2026/)?.className).toContain('rounded-none');
      expect(chip(/October 16, 2026/)?.className).toContain('rounded-s-none');
      expect(chip(/October 17, 2026/)).toBeUndefined();
    });

    it('the day list says the span and which day this is, first in the list', () => {
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={[standup, offsite]}
          defaultSelectedDate="2026-10-15"
        />,
      );
      // Intl puts thin spaces (U+2009) around the dash; compare with plain spaces.
      expect(listed().map((t) => t?.replace(/\s/g, ' '))).toEqual([
        'OffsiteOct 14 – 16 · Day 2 of 3',
        'Standup9:00 AM',
      ]);
    });
  });
});
