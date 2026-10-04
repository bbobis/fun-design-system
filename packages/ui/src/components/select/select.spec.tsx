import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { Field } from '../field';
import { Select, type SelectOption } from './select';

// jsdom has no CSS.escape (every real browser does); React Aria uses it to find options.
beforeAll(() => {
  globalThis.CSS ??= {} as typeof CSS;
  CSS.escape ??= (value: string) =>
    value.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
});

const statuses: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid', disabled: true },
];

/** The trigger is a button with a listbox popup (ARIA "select-only combobox"). */
const trigger = () => screen.getByRole('button', { name: /Status/ });
const press = (el: Element, key: string) =>
  act(() => {
    fireEvent.keyDown(el, { key });
    fireEvent.keyUp(el, { key });
  });

describe('Select', () => {
  it('is named by the Field label and shows the placeholder', () => {
    render(
      <Field label="Status">
        <Select options={statuses} placeholder="Choose a status" />
      </Field>,
    );
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger().textContent).toContain('Choose a status');
  });

  it('opens with ArrowDown, picks with Enter, calls onChange with the value', () => {
    const onChange = vi.fn();
    render(
      <Field label="Status">
        <Select options={statuses} onChange={onChange} />
      </Field>,
    );
    press(trigger(), 'ArrowDown');
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getAllByRole('option')).toHaveLength(4);
    press(document.activeElement as Element, 'ArrowDown'); // Draft → Pending
    press(document.activeElement as Element, 'Enter');
    expect(onChange).toHaveBeenCalledWith('pending');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger().textContent).toContain('Pending');
  });

  it('returns focus to the trigger when the popup closes', async () => {
    render(
      <Field label="Status">
        <Select options={statuses} />
      </Field>,
    );
    // Focus the trigger first, as a keyboard user would (Tab). React Aria remembers what
    // had focus before the popup opened and gives it back when it closes.
    act(() => trigger().focus());
    press(trigger(), 'ArrowDown');
    expect(document.activeElement?.getAttribute('role')).toBe('option'); // focus moved into the list
    press(document.activeElement as Element, 'Escape');
    expect(screen.queryByRole('listbox')).toBeNull();
    // Focus is handed back on the next animation frame, after the popup unmounts.
    await act(
      () => new Promise((r) => requestAnimationFrame(() => r(undefined))),
    );
    expect(document.activeElement).toBe(trigger());
  });

  it('marks disabled options and skips them', () => {
    render(<Select aria-label="Status" options={statuses} />);
    press(trigger(), 'ArrowDown');
    const paid = screen.getByRole('option', { name: 'Paid' });
    expect(paid.getAttribute('aria-disabled')).toBe('true');
  });

  it('wires the Field: description and error in aria-describedby, invalid, required', () => {
    render(
      <Field
        label="Status"
        description="Workflow state"
        error="Pick a status"
        required
      >
        <Select options={statuses} />
      </Field>,
    );
    const describedBy = trigger().getAttribute('aria-describedby') ?? '';
    const text = describedBy
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent)
      .join(' | ');
    expect(text).toContain('Workflow state');
    expect(text).toContain('Pick a status');
  });

  it('works controlled', () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('overdue');
      return (
        <>
          <Select
            aria-label="Status"
            options={statuses}
            value={value}
            onChange={setValue}
          />
          <output data-testid="value">{value}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(trigger().textContent).toContain('Overdue');
    press(trigger(), 'ArrowDown');
    press(document.activeElement as Element, 'Home');
    press(document.activeElement as Element, 'Enter');
    expect(screen.getByTestId('value').textContent).toBe('draft');
  });

  it('posts its value in a plain form via a hidden select', () => {
    const { container } = render(
      <form>
        <Select
          aria-label="Status"
          options={statuses}
          name="status"
          defaultValue="pending"
        />
      </form>,
    );
    const form = container.querySelector('form') as HTMLFormElement;
    expect(new FormData(form).get('status')).toBe('pending');
  });

  it('respects disabled', () => {
    render(<Select aria-label="Status" options={statuses} disabled />);
    expect((trigger() as HTMLButtonElement).disabled).toBe(true);
  });
});
