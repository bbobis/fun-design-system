import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { must } from '../../utils/must';
import { Calendar, RangeCalendar } from './calendar';

/** A day's button by its visible number, in the (first) grid. */
const day = (n: number) =>
  must(
    within(screen.getAllByRole('grid')[0] as HTMLElement)
      .getAllByRole('button')
      .find((b) => b.textContent === String(n)),
  );
const cell = (n: number) => must(day(n).closest('[role="gridcell"]'));

describe('Calendar', () => {
  it('is a grid named by aria-label and the month, starting on the chosen day', () => {
    render(<Calendar aria-label="Delivery date" defaultValue="2026-11-14" />);
    const grid = screen.getByRole('grid');
    expect(grid.getAttribute('aria-label')).toMatch(/November 2026/);
    expect(cell(14).getAttribute('aria-selected')).toBe('true');
    expect(
      screen.getByRole('application', { name: /Delivery date/ }),
    ).toBeTruthy();
  });

  it('picking a day reports it as ISO text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        aria-label="Delivery date"
        defaultValue="2026-11-14"
        onChange={onChange}
      />,
    );
    await user.click(day(20));
    expect(onChange).toHaveBeenLastCalledWith('2026-11-20');
  });

  it('keyboard: arrows move by day, Enter picks', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        aria-label="Delivery date"
        defaultValue="2026-11-14"
        onChange={onChange}
      />,
    );
    act(() => day(14).focus());
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-22');
  });

  it('the prediction: unavailable days can be focused but not picked; days before min cannot be focused', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        aria-label="Delivery date"
        defaultValue="2026-11-14"
        min="2026-11-13"
        unavailable={(iso) => iso === '2026-11-15'}
        onChange={onChange}
      />,
    );
    // Unavailable: reachable with the keyboard, not pickable.
    act(() => day(14).focus());
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(day(15));
    expect(cell(15).getAttribute('aria-disabled')).toBe('true');
    await user.keyboard('{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    // Before min: ← from the 13th stays on the 13th.
    act(() => day(13).focus());
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(day(13));
  });

  it('firstDayOfWeek="mon" puts Monday first', () => {
    render(
      <Calendar
        aria-label="Delivery date"
        defaultValue="2026-11-14"
        firstDayOfWeek="mon"
      />,
    );
    // The weekday row is a <thead> React Aria hides from screen readers (each day's
    // own name says the weekday), so query the cells directly.
    const headers = Array.from(document.querySelectorAll('thead th')).map(
      (th) => th.textContent,
    );
    expect(headers.slice(0, 2)).toEqual(['M', 'T']);
    expect(headers[6]).toBe('S');
  });

  it('size and variant set the day size and the box', () => {
    const { container } = render(
      <Calendar
        aria-label="Delivery date"
        defaultValue="2026-11-14"
        size="sm"
        variant="card"
      />,
    );
    expect(day(14).classList.contains('size-8')).toBe(true);
    expect(must(container.firstElementChild).classList.contains('border')).toBe(
      true,
    );
  });
});

describe('RangeCalendar', () => {
  it('two clicks set the range; onChange fires once, with ISO text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RangeCalendar
        aria-label="Stay"
        defaultValue={{ start: '2026-11-02', end: '2026-11-04' }}
        onChange={onChange}
      />,
    );
    await user.click(day(10));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(day(13));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      start: '2026-11-10',
      end: '2026-11-13',
    });
  });

  it('visibleMonths={2} shows two grids', () => {
    render(
      <RangeCalendar
        aria-label="Stay"
        defaultValue={{ start: '2026-11-28', end: '2026-12-02' }}
        visibleMonths={2}
      />,
    );
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });
});
