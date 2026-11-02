import { getLocalTimeZone, today } from '@internationalized/date';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { TimeField } from '../time-field';
import { DatePicker } from './date-picker';
import { DateRangePicker } from './date-range-picker';

const openCalendar = () => {
  act(() => {
    fireEvent.click(screen.getByRole('button', { name: /calendar/i }));
  });
};
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(null))));
/** The styled day box inside the first day cell of the (first) grid. */
const firstDay = () =>
  screen.getAllByRole('grid')[0].querySelector('td > div') as HTMLElement;
const has = (el: Element, ...classes: string[]) =>
  classes.forEach((c) => expect(el.classList.contains(c)).toBe(true));
const lacks = (el: Element, ...classes: string[]) =>
  classes.forEach((c) => expect(el.classList.contains(c)).toBe(false));

describe('calendar size follows the field size', () => {
  it.each([
    ['sm', 'size-8'],
    ['md', 'size-9'],
    ['lg', 'size-10'],
  ] as const)('DatePicker size=%s → days are %s', (size, cls) => {
    render(
      <DatePicker aria-label="Due" defaultValue="2026-10-04" size={size} />,
    );
    openCalendar();
    has(firstDay(), cls);
  });

  it('no size → md calendar', () => {
    render(<DatePicker aria-label="Due" defaultValue="2026-10-04" />);
    openCalendar();
    has(firstDay(), 'size-9', 'text-sm');
  });

  it('DateRangePicker passes its size too', () => {
    render(
      <DateRangePicker
        aria-label="Period"
        defaultValue={{ start: '2026-10-01', end: '2026-10-07' }}
        size="lg"
      />,
    );
    openCalendar();
    has(firstDay(), 'size-10', 'text-base');
    lacks(firstDay(), 'size-9');
  });
});

describe('DatePicker showToday', () => {
  it('has no Today button by default', () => {
    render(<DatePicker aria-label="Due" defaultValue="2026-10-04" />);
    openCalendar();
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull();
  });

  it('Today picks today and closes the calendar', async () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2020-01-15"
        onChange={onChange}
        showToday
      />,
    );
    openCalendar();
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    });
    expect(onChange).toHaveBeenLastCalledWith(
      today(getLocalTimeZone()).toString(),
    );
    await nextFrame();
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('Today is disabled when today is after max', () => {
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2020-01-15"
        max="2020-12-31"
        showToday
      />,
    );
    openCalendar();
    expect(
      (screen.getByRole('button', { name: 'Today' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});

describe('DateRangePicker visibleMonths', () => {
  const range = { start: '2026-10-28', end: '2026-11-03' };
  const gridNames = () =>
    screen.getAllByRole('grid').map((g) => g.getAttribute('aria-label'));

  it('1 month by default', () => {
    render(<DateRangePicker aria-label="Period" defaultValue={range} />);
    openCalendar();
    expect(screen.getAllByRole('grid')).toHaveLength(1);
  });

  it('2 shows two months side by side, and › moves two months', () => {
    render(
      <DateRangePicker
        aria-label="Period"
        defaultValue={range}
        visibleMonths={2}
      />,
    );
    openCalendar();
    expect(gridNames()).toEqual([
      expect.stringMatching(/October 2026/),
      expect.stringMatching(/November 2026/),
    ]);
    act(() => {
      // React Aria also renders hidden "Next"/"Previous" helpers; take the visible one.
      fireEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    });
    expect(gridNames()).toEqual([
      expect.stringMatching(/December 2026/),
      expect.stringMatching(/January 2027/),
    ]);
  });

  it('narrow screens get one month even with visibleMonths={2}', () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })) as unknown as typeof window.matchMedia;
    try {
      render(
        <DateRangePicker
          aria-label="Period"
          defaultValue={range}
          visibleMonths={2}
        />,
      );
      openCalendar();
      expect(screen.getAllByRole('grid')).toHaveLength(1);
    } finally {
      window.matchMedia = original;
    }
  });
});

describe('TimeField icon', () => {
  it('shows the clock by default and hides it with icon={false}', () => {
    const { rerender } = render(<TimeField aria-label="Start" />);
    const box = () => screen.getAllByRole('group')[0];
    expect(box().querySelector('svg')).not.toBeNull();
    rerender(<TimeField aria-label="Start" icon={false} />);
    expect(box().querySelector('svg')).toBeNull();
  });

  it('end padding matches the size', () => {
    const { rerender } = render(<TimeField aria-label="Start" size="sm" />);
    const box = () => screen.getAllByRole('group')[0];
    has(box(), 'pe-2');
    rerender(<TimeField aria-label="Start" size="lg" />);
    has(box(), 'pe-3.5');
    lacks(box(), 'pe-2.5');
  });
});
