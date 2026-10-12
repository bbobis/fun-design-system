import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { Field } from '../field';
import { DateRangePicker } from './date-range-picker';
import type { IsoDateRange } from './iso-date';

const segments = () =>
  screen.getAllByRole('spinbutton').map((s) => s.textContent);
const openCalendar = () =>
  act(() => fireEvent.click(screen.getByRole('button', { name: /calendar/i })));
// A day's accessible name carries extras ("Selected Range: … to …", "First available
// date"), so find days by their number, skipping the faded days of other months.
const day = (n: number) => {
  const cell = within(screen.getByRole('grid'))
    .getAllByRole('button')
    .find(
      (b) =>
        b.textContent === String(n) && !b.hasAttribute('data-outside-month'),
    );
  if (!cell) throw new Error(`No day ${n} in the calendar`);
  return cell;
};
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(null))));
// Same as DatePicker's tests: React Aria segments take digits from `beforeinput`.
const typeInto = (el: HTMLElement, text: string) =>
  act(() => {
    el.focus();
    for (const ch of text) {
      fireEvent(
        document.activeElement as HTMLElement,
        new InputEvent('beforeinput', {
          data: ch,
          inputType: 'insertText',
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  });

const october = { start: '2026-10-05', end: '2026-10-09' };

describe('DateRangePicker', () => {
  it('is named by the Field label; start and end pieces are named', () => {
    render(
      <Field label="Report period">
        <DateRangePicker defaultValue={october} />
      </Field>,
    );
    expect(
      screen.getAllByRole('group', { name: 'Report period' }).length,
    ).toBeGreaterThan(0);
    expect(segments()).toEqual(['10', '5', '2026', '10', '9', '2026']);
    // React Aria names each piece with its end: "month, Start Date", "day, End Date".
    const names = screen
      .getAllByRole('spinbutton')
      .map((s) => s.getAttribute('aria-label'));
    expect(names[0]).toMatch(/^month, Start Date/);
    expect(names[4]).toMatch(/^day, End Date/);
  });

  it('calendar: first click sets the start, second the end; onChange fires once, after the end', async () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Period"
        defaultValue={october}
        onChange={onChange}
      />,
    );
    openCalendar();
    act(() => fireEvent.click(day(12)));
    // Half a range is not a value yet.
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
    act(() => fireEvent.click(day(20)));
    await nextFrame();
    expect(onChange).toHaveBeenLastCalledWith({
      start: '2026-10-12',
      end: '2026-10-20',
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('clicking the later day first still gives start ≤ end', async () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Period"
        defaultValue={october}
        onChange={onChange}
      />,
    );
    openCalendar();
    act(() => fireEvent.click(day(20)));
    act(() => fireEvent.click(day(12)));
    await nextFrame();
    expect(onChange).toHaveBeenLastCalledWith({
      start: '2026-10-12',
      end: '2026-10-20',
    });
  });

  it('marks start, end and the days between for screen readers', () => {
    render(<DateRangePicker aria-label="Period" defaultValue={october} />);
    openCalendar();
    const selected = (n: number) =>
      day(n).closest('[role=gridcell]')?.getAttribute('aria-selected');
    expect([4, 5, 7, 9, 10].map(selected)).toEqual([
      null,
      'true',
      'true',
      'true',
      null,
    ]);
    expect(day(5).hasAttribute('data-selection-start')).toBe(true);
    expect(day(9).hasAttribute('data-selection-end')).toBe(true);
  });

  it('typing an end before the start marks the field invalid (and still reports it)', () => {
    const onChange = vi.fn();
    render(
      <DateRangePicker
        aria-label="Period"
        defaultValue={october}
        onChange={onChange}
      />,
    );
    const endDay = screen.getAllByRole('spinbutton')[4] as HTMLElement;
    typeInto(endDay, '01');
    expect(segments().slice(3)).toEqual(['10', '1', '2026']);
    expect(endDay.getAttribute('aria-invalid')).toBe('true');
    // Passed on as typed, so the app can show its own message if it wants one.
    expect(onChange).toHaveBeenLastCalledWith({
      start: '2026-10-05',
      end: '2026-10-01',
    });
  });

  it('required and empty is not shown as an error before anything is typed', () => {
    render(<DateRangePicker aria-label="Period" required />);
    expect(
      screen.getAllByRole('spinbutton')[0].getAttribute('aria-invalid'),
    ).toBeNull();
  });

  it('disables days outside min / max', () => {
    render(
      <DateRangePicker
        aria-label="Period"
        defaultValue={october}
        min="2026-10-03"
        max="2026-10-25"
      />,
    );
    openCalendar();
    expect(day(2).getAttribute('aria-disabled')).toBe('true');
    expect(day(26).getAttribute('aria-disabled')).toBe('true');
    expect(day(3).getAttribute('aria-disabled')).toBeNull();
  });

  it('controlled: shows the value, and null clears both ends', () => {
    function Controlled() {
      const [value, setValue] = useState<IsoDateRange | null>(october);
      return (
        <>
          <DateRangePicker
            aria-label="Period"
            value={value}
            onChange={setValue}
          />
          <button type="button" onClick={() => setValue(null)}>
            clear
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(segments()).toEqual(['10', '5', '2026', '10', '9', '2026']);
    act(() => fireEvent.click(screen.getByText('clear')));
    expect(segments()).toEqual(['mm', 'dd', 'yyyy', 'mm', 'dd', 'yyyy']);
  });

  it('a half-filled or malformed value counts as no range', () => {
    render(
      <DateRangePicker
        aria-label="Period"
        defaultValue={{ start: '2026-10-05', end: '9/10/2026' }}
      />,
    );
    expect(segments()).toEqual(['mm', 'dd', 'yyyy', 'mm', 'dd', 'yyyy']);
  });

  it('posts both ends with the form', () => {
    const { container } = render(
      <form>
        <DateRangePicker
          aria-label="Period"
          startName="from"
          endName="to"
          defaultValue={october}
        />
      </form>,
    );
    const data = new FormData(
      container.querySelector('form') as HTMLFormElement,
    );
    expect([data.get('from'), data.get('to')]).toEqual([
      '2026-10-05',
      '2026-10-09',
    ]);
  });

  it('wires the Field description and error', () => {
    render(
      <Field
        label="Report period"
        description="Up to 31 days"
        error="Pick a shorter period"
      >
        <DateRangePicker defaultValue={october} />
      </Field>,
    );
    const first = screen.getAllByRole('spinbutton')[0] as HTMLElement;
    const text = (first.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .map((i) => document.getElementById(i)?.textContent)
      .join(' | ');
    expect(text).toContain('Up to 31 days');
    expect(text).toContain('Pick a shorter period');
    expect(first.getAttribute('aria-invalid')).toBe('true');
  });
});
