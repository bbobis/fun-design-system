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
const norm = (t: string | null | undefined) => t?.replace(/\s/g, ' ');
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

  describe('week view', () => {
    const weekEvents: CalendarEvent[] = [
      {
        id: 'sync',
        date: '2026-10-15',
        time: '10:00',
        endTime: '11:00',
        title: 'Team sync',
      },
      {
        id: 'review',
        date: '2026-10-15',
        time: '10:30',
        endTime: '11:30',
        title: 'Design review',
      },
      { id: 'plan', date: '2026-10-29', time: '11:00', title: 'Planning' },
      {
        id: 'off',
        date: '2026-10-14',
        endDate: '2026-10-16',
        title: 'Offsite',
      },
    ];
    const norm = (t: string | null | undefined) => t?.replace(/\s/g, ' ');
    // The day list beside the grid holds the same events, so look inside the week.
    const week = () =>
      within(screen.getByRole('region', { name: 'Team calendar' }));
    const weekHeading = () =>
      norm(screen.getAllByRole('heading')[0]?.textContent);

    it('Month | Week switches the view and reports it', async () => {
      const user = userEvent.setup();
      const onViewChange = vi.fn();
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={weekEvents}
          defaultSelectedDate="2026-10-15"
          onViewChange={onViewChange}
        />,
      );
      expect(screen.getByRole('grid')).toBeTruthy();
      await user.click(screen.getByRole('radio', { name: 'Week' }));
      expect(onViewChange).toHaveBeenLastCalledWith('week');
      expect(screen.queryByRole('grid')).toBeNull();
      expect(weekHeading()).toBe('Oct 11 – 17, 2026');
      expect(
        screen.getByRole('region', { name: 'Team calendar' }),
      ).toBeTruthy();
    });

    it('timed events are buttons, described by their day; overlaps share the width', () => {
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={weekEvents}
          defaultView="week"
          defaultSelectedDate="2026-10-15"
        />,
      );
      const sync = week().getByRole('button', { name: /^Team sync/ });
      expect(norm(sync.textContent)).toBe('Team sync10:00 AM – 11:00 AM');
      const day = document.getElementById(
        sync.getAttribute('aria-describedby') ?? '',
      );
      expect(day?.getAttribute('aria-label')).toBe('Thursday, October 15');
      expect(sync.style.getPropertyValue('--lanes')).toBe('2');
      expect(sync.style.getPropertyValue('--top')).toBe('30rem'); // 10 h × 3rem
      expect(
        week()
          .getByRole('button', { name: /^Design review/ })
          .style.getPropertyValue('--lane'),
      ).toBe('1');
    });

    it('multi-day and all-day events sit in the all-day row, as buttons', async () => {
      const user = userEvent.setup();
      const onEventAction = vi.fn();
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={weekEvents}
          defaultView="week"
          defaultSelectedDate="2026-10-15"
          onEventAction={onEventAction}
        />,
      );
      const offsite = screen.getAllByRole('button', { name: 'Offsite' });
      expect(offsite).toHaveLength(3); // Wed, Thu, Fri
      await user.click(offsite[1]!);
      expect(onEventAction).toHaveBeenCalledWith(weekEvents[3]);
    });

    it('focusing an event moves the day list to its day', async () => {
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={weekEvents}
          defaultView="week"
          defaultSelectedDate="2026-10-12"
        />,
      );
      act(() =>
        week()
          .getByRole('button', { name: /^Team sync/ })
          .focus(),
      );
      expect(within(dayList()).getByRole('heading').textContent).toBe(
        'Thursday, October 153 events', // Team sync, Design review, and the Offsite span
      );
    });

    it('› moves a week; crossing into November reports the month', async () => {
      const user = userEvent.setup();
      const onMonthChange = vi.fn();
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={weekEvents}
          defaultView="week"
          defaultSelectedDate="2026-10-29"
          onMonthChange={onMonthChange}
        />,
      );
      expect(week().getByRole('button', { name: /^Planning/ })).toBeTruthy();
      await user.click(screen.getByRole('button', { name: 'Next week' }));
      expect(weekHeading()).toBe('Nov 1 – 7, 2026');
      expect(onMonthChange).toHaveBeenLastCalledWith('2026-11');
    });

    it('N on a day header creates on that day', async () => {
      const user = userEvent.setup();
      const onCreateEvent = vi.fn();
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={weekEvents}
          defaultView="week"
          defaultSelectedDate="2026-10-15"
          onCreateEvent={onCreateEvent}
        />,
      );
      act(() =>
        screen.getByRole('button', { name: 'Friday, October 16' }).focus(),
      );
      await user.keyboard('n');
      expect(onCreateEvent).toHaveBeenCalledWith('2026-10-16');
    });

    it('the day list shows the end time too', () => {
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={weekEvents}
          defaultSelectedDate="2026-10-15"
        />,
      );
      expect(listed().map(norm)).toContain('Team sync10:00 AM – 11:00 AM');
    });
  });

  describe('moving and resizing (onEventChange)', () => {
    const start: CalendarEvent[] = [
      {
        id: 'sync',
        date: '2026-10-15',
        time: '10:00',
        endTime: '11:00',
        title: 'Team sync',
      },
    ];
    function Draggable({ onChange }: { onChange?: (c: unknown) => void }) {
      const [list, setList] = useState(start);
      return (
        <EventCalendar
          aria-label="Team calendar"
          events={list}
          defaultView="week"
          defaultSelectedDate="2026-10-15"
          onEventChange={(event, change) => {
            onChange?.(change);
            setList((l) =>
              l.map((e) => (e.id === event.id ? { ...e, ...change } : e)),
            );
          }}
        />
      );
    }
    const block = () =>
      within(screen.getByRole('region', { name: 'Team calendar' })).getByRole(
        'button',
        {
          name: /^Team sync/,
        },
      );

    it('↓ moves 15 minutes, ← → move a day; focus stays on the block', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Draggable onChange={onChange} />);
      act(() => block().focus());
      await user.keyboard('{ArrowDown}');
      expect(onChange).toHaveBeenLastCalledWith({
        date: '2026-10-15',
        time: '10:15',
        endTime: '11:15',
      });
      await user.keyboard('{ArrowRight}');
      expect(onChange).toHaveBeenLastCalledWith({
        date: '2026-10-16',
        time: '10:15',
        endTime: '11:15',
      });
      // The block now lives in Friday's column: a new element, and focus followed it.
      expect(document.activeElement).toBe(block());
      expect(
        document
          .getElementById(
            block().getAttribute('aria-describedby')!.split(' ')[0]!,
          )
          ?.getAttribute('aria-label'),
      ).toBe('Friday, October 16');
    });

    it('Shift+↓ makes it longer; it never gets shorter than 15 minutes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Draggable onChange={onChange} />);
      act(() => block().focus());
      await user.keyboard('{Shift>}{ArrowDown}{/Shift}');
      expect(onChange).toHaveBeenLastCalledWith({
        date: '2026-10-15',
        time: '10:00',
        endTime: '11:15',
      });
      for (let i = 0; i < 10; i++)
        await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
      expect(onChange).toHaveBeenLastCalledWith({
        date: '2026-10-15',
        time: '10:00',
        endTime: '10:15',
      });
    });

    it('announces each move and tells screen readers the keys', async () => {
      const user = userEvent.setup();
      render(<Draggable />);
      const hintId = block().getAttribute('aria-describedby')!.split(' ')[1]!;
      expect(document.getElementById(hintId)?.textContent).toMatch(
        /Arrow keys move/,
      );
      act(() => block().focus());
      await user.keyboard('{ArrowDown}');
      expect(norm(screen.getByText(/moved to/).textContent)).toBe(
        'Team sync moved to Thursday, October 15, 10:15 AM – 11:15 AM',
      );
    });

    it('without onEventChange, arrows do nothing and blocks still open', async () => {
      const user = userEvent.setup();
      const onEventAction = vi.fn();
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={start}
          defaultView="week"
          defaultSelectedDate="2026-10-15"
          onEventAction={onEventAction}
        />,
      );
      act(() => block().focus());
      await user.keyboard('{ArrowDown}');
      expect(norm(block().textContent)).toBe('Team sync10:00 AM – 11:00 AM');
      await user.keyboard('{Enter}');
      expect(onEventAction).toHaveBeenCalledWith(start[0]);
    });
  });

  describe('drag to create (week view)', () => {
    /** 1 px = 1 minute: the column is 1440 px tall from y = 0. */
    const column = (date: string) => {
      const el = document.querySelector<HTMLElement>(
        `[data-day-column="${date}"]`,
      );
      if (!el) throw new Error(date);
      el.getBoundingClientRect = () =>
        ({ top: 0, height: 1440, width: 100 }) as DOMRect;
      return el;
    };
    /** jsdom has no PointerEvent; React reads the same fields off a MouseEvent. */
    const pointer = (
      el: Element,
      type: string,
      clientY: number,
      init: Record<string, unknown> = {},
    ) =>
      act(() => {
        const e = new MouseEvent(type, { bubbles: true, clientY, button: 0 });
        Object.assign(e, init);
        el.dispatchEvent(e);
      });
    const setup = () => {
      const onCreateEvent = vi.fn();
      render(
        <EventCalendar
          aria-label="Team calendar"
          events={[
            {
              id: 'x',
              date: '2026-10-15',
              time: '10:00',
              endTime: '11:00',
              title: 'Team sync',
            },
          ]}
          defaultView="week"
          defaultSelectedDate="2026-10-15"
          onCreateEvent={onCreateEvent}
        />,
      );
      return onCreateEvent;
    };

    it('dragging up from 11:00 to 9:40 gives 09:30–11:00 (the prediction)', () => {
      const onCreateEvent = setup();
      const col = column('2026-10-16');
      pointer(col, 'pointerdown', 660);
      pointer(col, 'pointermove', 620);
      pointer(col, 'pointermove', 580);
      // The dashed preview shows the range while dragging.
      expect(
        norm(
          col.querySelector('[aria-hidden="true"].border-dashed')?.textContent,
        ),
      ).toBe('9:30 AM – 11:00 AM');
      pointer(col, 'pointerup', 580);
      expect(onCreateEvent).toHaveBeenCalledWith('2026-10-16', {
        time: '09:30',
        endTime: '11:00',
      });
    });

    it('a click picks a 30-minute slot', () => {
      const onCreateEvent = setup();
      const col = column('2026-10-16');
      pointer(col, 'pointerdown', 610);
      pointer(col, 'pointerup', 610);
      expect(onCreateEvent).toHaveBeenCalledWith('2026-10-16', {
        time: '10:00',
        endTime: '10:30',
      });
    });

    it('Escape cancels; pressing on an event does not create', async () => {
      const user = userEvent.setup();
      const onCreateEvent = setup();
      const col = column('2026-10-16');
      pointer(col, 'pointerdown', 600);
      pointer(col, 'pointermove', 700);
      await user.keyboard('{Escape}');
      pointer(col, 'pointerup', 700);
      expect(onCreateEvent).not.toHaveBeenCalled();

      const block = document.querySelector('[data-event-id="x"]');
      if (!block) throw new Error('block');
      pointer(block, 'pointerdown', 620);
      pointer(column('2026-10-15'), 'pointerup', 620);
      expect(onCreateEvent).not.toHaveBeenCalled();
    });

    it('a finger drag scrolls instead (pointercancel); a tap still creates', () => {
      const onCreateEvent = setup();
      const col = column('2026-10-16');
      pointer(col, 'pointerdown', 600, { pointerType: 'touch' });
      pointer(col, 'pointercancel', 600);
      pointer(col, 'pointerup', 600);
      expect(onCreateEvent).not.toHaveBeenCalled();
      pointer(col, 'pointerdown', 600, { pointerType: 'touch' });
      pointer(col, 'pointerup', 600);
      expect(onCreateEvent).toHaveBeenCalledWith('2026-10-16', {
        time: '10:00',
        endTime: '10:30',
      });
    });
  });
});
