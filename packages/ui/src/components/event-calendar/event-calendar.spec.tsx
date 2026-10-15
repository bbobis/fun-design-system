import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCalendar, type CalendarEvent } from './event-calendar';

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
});
