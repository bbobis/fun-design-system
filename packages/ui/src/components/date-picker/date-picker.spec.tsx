import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Field } from '../field';
import { DatePicker } from './date-picker';

const segments = () => screen.getAllByRole('spinbutton');
const segment = (name: string) =>
  screen.getByRole('spinbutton', { name: new RegExp(`^${name}`) });

// React Aria's date segments take typed digits from `beforeinput` (what browsers fire
// before text is inserted), not from keydown. jsdom doesn't fire it for us.
const typeInto = (el: HTMLElement, text: string) =>
  act(() => {
    el.focus();
    for (const ch of text) {
      const target = document.activeElement as HTMLElement;
      fireEvent(
        target,
        new InputEvent('beforeinput', {
          data: ch,
          inputType: 'insertText',
          bubbles: true,
          cancelable: true,
        }),
      );
    }
  });
const press = (
  el: Element,
  key: string,
  init: Partial<KeyboardEventInit> = {},
) =>
  act(() => {
    fireEvent.keyDown(el, { key, ...init });
    fireEvent.keyUp(el, { key, ...init });
  });
const nextFrame = () =>
  act(() => new Promise((r) => requestAnimationFrame(() => r(null))));

describe('DatePicker', () => {
  it('is named by the Field label and shows month / day / year pieces (en-US order)', () => {
    render(
      <Field label="Due date">
        <DatePicker defaultValue="2026-10-04" />
      </Field>,
    );
    expect(
      screen.getAllByRole('group', { name: 'Due date' }).length,
    ).toBeGreaterThan(0);
    expect(segments().map((s) => s.textContent)).toEqual(['10', '4', '2026']);
  });

  it('typing a full date reports it as an ISO string', () => {
    const onChange = vi.fn();
    render(<DatePicker aria-label="Due" onChange={onChange} />);
    // Each piece moves on by itself once it's full ("10" → day).
    typeInto(segment('month'), '10');
    typeInto(document.activeElement as HTMLElement, '04');
    typeInto(document.activeElement as HTMLElement, '2026');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-04');
  });

  it('↑ on a piece changes it by one', () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2026-10-04"
        onChange={onChange}
      />,
    );
    act(() => segment('day').focus());
    press(segment('day'), 'ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-05');
  });

  it('opens the calendar on the selected day, picks a day, and closes', async () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2026-10-04"
        onChange={onChange}
      />,
    );
    act(() =>
      fireEvent.click(screen.getByRole('button', { name: /calendar/i })),
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('grid').getAttribute('aria-label')).toContain(
      'October 2026',
    );
    // Focus lands on the selected day, ready for arrow keys.
    expect(document.activeElement?.getAttribute('aria-label')).toContain(
      'October 4, 2026',
    );
    const day15 = screen.getByRole('button', { name: /October 15, 2026/ });
    act(() => fireEvent.click(day15));
    await nextFrame();
    expect(onChange).toHaveBeenLastCalledWith('2026-10-15');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('disables days outside min / max', () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2026-10-10"
        min="2026-10-05"
        max="2026-10-20"
        onChange={onChange}
      />,
    );
    act(() =>
      fireEvent.click(screen.getByRole('button', { name: /calendar/i })),
    );
    const day3 = screen.getByRole('button', { name: /October 3, 2026/ });
    expect(day3.getAttribute('aria-disabled')).toBe('true');
    act(() => fireEvent.click(day3));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('controlled: shows the value, and null clears it', () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('2026-10-04');
      return (
        <>
          <DatePicker aria-label="Due" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue(null)}>
            clear
          </button>
        </>
      );
    }
    render(<Controlled />);
    expect(segments().map((s) => s.textContent)).toEqual(['10', '4', '2026']);
    act(() => fireEvent.click(screen.getByText('clear')));
    expect(segments().map((s) => s.textContent)).toEqual(['mm', 'dd', 'yyyy']);
  });

  it('treats malformed text as no date instead of crashing', () => {
    render(<DatePicker aria-label="Due" defaultValue="04/10/2026" />);
    expect(segments().map((s) => s.textContent)).toEqual(['mm', 'dd', 'yyyy']);
  });

  it('posts the ISO date with the form', () => {
    const { container } = render(
      <form>
        <DatePicker aria-label="Due" name="due" defaultValue="2026-10-04" />
      </form>,
    );
    expect(
      new FormData(container.querySelector('form') as HTMLFormElement).get(
        'due',
      ),
    ).toBe('2026-10-04');
  });

  it('wires the Field description and error', () => {
    render(
      <Field
        label="Due date"
        description="When payment is due"
        error="Pick a date"
      >
        <DatePicker />
      </Field>,
    );
    const first = segments()[0] as HTMLElement;
    const ids = (first.getAttribute('aria-describedby') ?? '').split(' ');
    const text = ids
      .map((i) => document.getElementById(i)?.textContent)
      .join(' | ');
    expect(text).toContain('When payment is due');
    expect(text).toContain('Pick a date');
    expect(first.getAttribute('aria-invalid')).toBe('true');
  });
});
