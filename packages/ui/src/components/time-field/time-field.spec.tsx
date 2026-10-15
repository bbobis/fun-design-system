import { act, fireEvent, render, screen } from '@testing-library/react';
import { Field } from '../field';
import { fromTime, toTime } from './iso-time';
import { TimeField } from './time-field';

const texts = () => screen.getAllByRole('spinbutton').map((s) => s.textContent);
const segment = (name: string) =>
  screen.getByRole('spinbutton', { name: new RegExp(`^${name}`) });

// Same as DatePicker's tests: React Aria's segments take typed digits from
// `beforeinput`, which jsdom doesn't fire for us.
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
const press = (el: Element, key: string) =>
  act(() => {
    fireEvent.keyDown(el, { key });
    fireEvent.keyUp(el, { key });
  });

describe('iso-time', () => {
  it('reads and writes 24-hour text, and rejects impossible times', () => {
    expect(fromTime(toTime('09:05')!, 'minute')).toBe('09:05');
    expect(fromTime(toTime('23:59:30')!, 'second')).toBe('23:59:30');
    for (const bad of ['25:00', '12:60', '9:05', '09-05', '', null, undefined])
      expect(toTime(bad)).toBeNull();
  });
});

describe('TimeField', () => {
  it('is named by the Field label; 12-hour pieces in en-US', () => {
    render(
      <Field label="Start time">
        <TimeField defaultValue="14:30" />
      </Field>,
    );
    expect(
      screen.getAllByRole('group', { name: 'Start time' }).length,
    ).toBeGreaterThan(0);
    expect(texts()).toEqual(['2', '30', 'PM']);
  });

  it('hourCycle={24}: no AM/PM; the value is the same text', () => {
    render(
      <TimeField aria-label="Start" defaultValue="14:30" hourCycle={24} />,
    );
    expect(texts()).toEqual(['14', '30']);
  });

  it('typing reports 24-hour text, even in a 12-hour field', () => {
    const onChange = vi.fn();
    render(<TimeField aria-label="Start" onChange={onChange} />);
    typeInto(segment('hour'), '9');
    typeInto(segment('minute'), '05');
    typeInto(segment('AM/PM'), 'P');
    expect(onChange).toHaveBeenLastCalledWith('21:05');
  });

  it('↑ on the hour wraps inside AM/PM: 11:30 AM → 12:30 AM (00:30), like native inputs', () => {
    const onChange = vi.fn();
    render(
      <TimeField aria-label="Start" defaultValue="11:30" onChange={onChange} />,
    );
    act(() => segment('hour').focus());
    press(segment('hour'), 'ArrowUp');
    // Each piece spins on its own; the hour never flips AM/PM. Change that piece instead.
    expect(texts()).toEqual(['12', '30', 'AM']);
    expect(onChange).toHaveBeenLastCalledWith('00:30');
    press(segment('AM/PM'), 'ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith('12:30');
  });

  it("granularity='second' adds a seconds piece", () => {
    render(
      <TimeField
        aria-label="Start"
        defaultValue="08:15:45"
        granularity="second"
        hourCycle={24}
      />,
    );
    expect(texts()).toEqual(['08', '15', '45']);
  });

  it('outside min/max is invalid; inside is fine', () => {
    const { rerender } = render(
      <TimeField aria-label="Start" value="07:30" min="08:00" max="18:00" />,
    );
    expect(segment('hour').getAttribute('aria-invalid')).toBe('true');
    rerender(
      <TimeField aria-label="Start" value="09:00" min="08:00" max="18:00" />,
    );
    expect(segment('hour').hasAttribute('aria-invalid')).toBe(false);
  });

  it('posts the same HH:mm text as onChange', () => {
    const { container } = render(
      <form>
        <TimeField aria-label="Start" name="start" defaultValue="14:30" />
      </form>,
    );
    const data = new FormData(
      container.querySelector('form') as HTMLFormElement,
    );
    expect(data.getAll('start')).toEqual(['14:30']);
  });

  it('disabled: pieces cannot be focused', () => {
    render(<TimeField aria-label="Start" defaultValue="14:30" disabled />);
    expect(segment('hour').getAttribute('aria-disabled')).toBe('true');
  });
});
