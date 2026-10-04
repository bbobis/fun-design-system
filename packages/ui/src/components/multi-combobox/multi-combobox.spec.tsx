import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Field } from '../field';
import { MultiCombobox, type MultiComboboxOption } from './multi-combobox';

// React Aria's virtualizer sizes the list from the scroll view's client size; jsdom has
// no layout, so give elements a fake 320×288 box.
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(288);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
});
afterAll(() => vi.restoreAllMocks());

const countries: MultiComboboxOption[] = [
  { value: 'ca', label: 'Canada' },
  { value: 'cl', label: 'Chile' },
  { value: 'de', label: 'Germany' },
  { value: 'us', label: 'United States' },
];

const input = () => screen.getByRole('combobox') as HTMLInputElement;
const press = (key: string) =>
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key });
    fireEvent.keyUp(document.activeElement as Element, { key });
  });
const type = (text: string) =>
  act(() => {
    fireEvent.change(input(), { target: { value: text } });
  });
// `hidden: true`: while the list is open, React Aria hides everything outside the input
// and the list from screen readers (aria-hidden), tags included. Role queries skip
// hidden elements by default, so without this the tags "vanish" mid-test.
const tagTexts = () =>
  screen.queryAllByRole('row', { hidden: true }).map((r) => r.textContent);

describe('MultiCombobox', () => {
  it('adds a tag per pick, clears the text and keeps the list open', () => {
    const onChange = vi.fn();
    render(
      <Field label="Countries">
        <MultiCombobox
          options={countries}
          onChange={onChange}
          placeholder="Add a country"
        />
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: 'Countries' })).toBe(input());
    expect(input().placeholder).toBe('Add a country');
    act(() => input().focus());
    type('ger');
    press('ArrowDown');
    press('Enter');
    expect(onChange).toHaveBeenLastCalledWith(['de']);
    expect(input().value).toBe('');
    expect(screen.getByRole('listbox')).toBeTruthy(); // still open for the next pick
    type('uni');
    press('ArrowDown');
    press('Enter');
    expect(onChange).toHaveBeenLastCalledWith(['de', 'us']);
    expect(tagTexts()).toEqual(['Germany', 'United States']);
    // The placeholder would read as a value next to tags, so it goes.
    expect(input().placeholder).toBe('');
  });

  it('removes a tag with its × button (named "Remove …" for screen readers)', () => {
    const onChange = vi.fn();
    render(
      <MultiCombobox
        aria-label="Countries"
        options={countries}
        defaultValue={['ca', 'de']}
        onChange={onChange}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: /remove/i });
    expect(buttons).toHaveLength(2);
    act(() => fireEvent.click(buttons[0] as HTMLElement));
    expect(onChange).toHaveBeenLastCalledWith(['de']);
    expect(tagTexts()).toEqual(['Germany']);
  });

  it('Backspace in the empty input removes the last tag', () => {
    render(
      <MultiCombobox
        aria-label="Countries"
        options={countries}
        defaultValue={['ca', 'de']}
      />,
    );
    act(() => input().focus());
    press('Backspace');
    expect(tagTexts()).toEqual(['Canada']);
    type('c'); // with text, Backspace edits the text instead
    press('Backspace');
    expect(tagTexts()).toEqual(['Canada']);
  });

  it('moves focus to the input when the last tag is removed (never to <body>)', () => {
    render(
      <MultiCombobox
        aria-label="Countries"
        options={countries}
        defaultValue={['ca']}
      />,
    );
    act(() => fireEvent.click(screen.getByRole('button', { name: /remove/i })));
    expect(tagTexts()).toEqual([]);
    expect(document.activeElement).toBe(input());
  });

  it('server search: tags keep their labels when new results no longer contain them', () => {
    const all = [
      { value: 'a', label: 'Acme' },
      { value: 'b', label: 'Bolt' },
    ];
    function Server() {
      const [query, setQuery] = useState('');
      const results = all.filter(
        (o) => query && o.label.toLowerCase().includes(query.toLowerCase()),
      );
      return (
        <MultiCombobox
          aria-label="Customers"
          filter="none"
          options={results}
          onInputChange={setQuery}
        />
      );
    }
    render(<Server />);
    act(() => input().focus());
    type('ac');
    press('ArrowDown');
    press('Enter'); // Acme; the text clears, so the results are now empty
    type('bo');
    press('ArrowDown');
    press('Enter');
    expect(tagTexts()).toEqual(['Acme', 'Bolt']);
  });

  it('posts one form entry per picked value', () => {
    const { container } = render(
      <form>
        <MultiCombobox
          aria-label="Countries"
          options={countries}
          name="countries"
          defaultValue={['de', 'us']}
        />
      </form>,
    );
    const data = new FormData(
      container.querySelector('form') as HTMLFormElement,
    );
    expect(data.getAll('countries')).toEqual(['de', 'us']);
  });

  it('disabled: tags stay visible but cannot be removed', () => {
    render(
      <MultiCombobox
        aria-label="Countries"
        options={countries}
        defaultValue={['ca']}
        disabled
      />,
    );
    expect(tagTexts()).toEqual(['Canada']);
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
    expect(input().disabled).toBe(true);
  });

  it('wires the Field description and error', () => {
    render(
      <Field
        label="Countries"
        description="Where you ship"
        error="Pick at least one"
      >
        <MultiCombobox options={countries} />
      </Field>,
    );
    const ids = (input().getAttribute('aria-describedby') ?? '').split(' ');
    const text = ids
      .map((i) => document.getElementById(i)?.textContent)
      .join(' | ');
    expect(text).toContain('Where you ship');
    expect(text).toContain('Pick at least one');
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });
});
