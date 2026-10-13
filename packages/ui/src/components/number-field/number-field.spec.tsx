import { act, fireEvent, render, screen } from '@testing-library/react';
import { Field } from '../field';
import { NumberField } from './number-field';

const input = () => screen.getByRole('textbox') as HTMLInputElement;
const type = (text: string) =>
  act(() => {
    fireEvent.change(input(), { target: { value: text } });
  });
const blur = () => fireEvent.blur(input());
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(input(), { key });
    fireEvent.keyUp(input(), { key });
  });

describe('NumberField', () => {
  it('is named by the Field label and described by its help text', () => {
    render(
      <Field label="Subtotal" description="Before tax.">
        <NumberField />
      </Field>,
    );
    const box = screen.getByRole('textbox', { name: 'Subtotal' });
    expect(box.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('formats for display, but the app gets a plain number', () => {
    const onChange = vi.fn();
    render(
      <NumberField
        aria-label="Subtotal"
        formatOptions={{ style: 'currency', currency: 'CAD' }}
        onChange={onChange}
      />,
    );
    act(() => input().focus());
    type('1234.5');
    blur();
    expect(onChange).toHaveBeenLastCalledWith(1234.5);
    expect(input().value).toContain('1,234.50');
  });

  it('↑ / ↓ step by `step`, clamped to min / max', () => {
    const onChange = vi.fn();
    render(
      <NumberField
        aria-label="Items"
        defaultValue={9}
        max={10}
        step={1}
        onChange={onChange}
      />,
    );
    act(() => input().focus());
    press('ArrowUp');
    expect(onChange).toHaveBeenLastCalledWith(10);
    press('ArrowUp'); // already at max
    expect(input().value).toBe('10');
  });

  it('clearing it gives null, not NaN', () => {
    const onChange = vi.fn();
    render(
      <NumberField aria-label="Tax" defaultValue={5} onChange={onChange} />,
    );
    act(() => input().focus());
    type('');
    blur();
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('the − / + buttons are named and kept out of the Tab order', () => {
    render(<NumberField aria-label="Items" defaultValue={1} />);
    const plus = screen.getByRole('button', { name: /increase/i });
    const minus = screen.getByRole('button', { name: /decrease/i });
    expect(plus.tabIndex).toBe(-1);
    expect(minus.tabIndex).toBe(-1);
  });

  it('hideStepper removes the buttons', () => {
    render(<NumberField aria-label="Items" hideStepper />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a form posts the plain number under `name`', () => {
    const { container } = render(
      <form>
        <NumberField
          aria-label="Subtotal"
          name="subtotal"
          defaultValue={1234.5}
          formatOptions={{ style: 'currency', currency: 'CAD' }}
        />
      </form>,
    );
    const data = new FormData(
      container.querySelector('form') as HTMLFormElement,
    );
    expect(data.get('subtotal')).toBe('1234.5');
  });
});
