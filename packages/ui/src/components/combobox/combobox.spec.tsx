import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Field } from '../field';
import { Combobox, type ComboboxOption } from './combobox';

// React Aria's virtualizer sizes the list from the scroll view's client size; jsdom has
// no layout (every size is 0), so give elements a fake 320×288 box for these tests.
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(288);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(320);
});
afterAll(() => vi.restoreAllMocks());

const countries: ComboboxOption[] = [
  { value: 'ca', label: 'Canada' },
  { value: 'cl', label: 'Chile' },
  { value: 'cn', label: 'China' },
  { value: 'de', label: 'Germany' },
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom', disabled: true },
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
const optionTexts = () =>
  screen.queryAllByRole('option').map((o) => o.textContent);

describe('Combobox', () => {
  it('is named by the Field label and keeps focus in the input while you arrow', () => {
    render(
      <Field label="Country">
        <Combobox options={countries} />
      </Field>,
    );
    expect(screen.getByRole('combobox', { name: 'Country' })).toBe(input());
    act(() => input().focus());
    press('ArrowDown');
    press('ArrowDown');
    // DOM focus never leaves the input; the highlighted option is referenced instead.
    expect(document.activeElement).toBe(input());
    const activeId = input().getAttribute('aria-activedescendant');
    expect(document.getElementById(activeId ?? '')?.textContent).toBe('Chile');
  });

  it('filters as you type ("contains", ignoring case and accents) and picks with Enter', () => {
    const onChange = vi.fn();
    render(
      <Combobox aria-label="Country" options={countries} onChange={onChange} />,
    );
    act(() => input().focus());
    type('ni');
    expect(optionTexts()).toEqual(['United States', 'United Kingdom']);
    press('ArrowDown');
    press('Enter');
    expect(onChange).toHaveBeenCalledWith('us');
    expect(input().value).toBe('United States');
  });

  it('filter="startsWith" only matches the beginning', () => {
    render(
      <Combobox aria-label="Country" options={countries} filter="startsWith" />,
    );
    act(() => input().focus());
    type('ch');
    expect(optionTexts()).toEqual(['Chile', 'China']);
  });

  it('says so when nothing matches', () => {
    render(
      <Combobox
        aria-label="Country"
        options={countries}
        emptyMessage="No country"
      />,
    );
    act(() => input().focus());
    type('zz');
    expect(screen.getByText('No country')).toBeTruthy();
  });

  it('server search: keeps the selected label when new results no longer contain it', async () => {
    function Server() {
      const [results, setResults] = useState<ComboboxOption[]>([
        { value: 'a', label: 'Acme' },
        { value: 'b', label: 'Bolt' },
      ]);
      const [value, setValue] = useState<string | null>(null);
      return (
        <>
          <Combobox
            aria-label="Customer"
            filter="none"
            options={results}
            value={value}
            onChange={setValue}
          />
          <button
            type="button"
            onClick={() => setResults([{ value: 'c', label: 'Cobalt' }])}
          >
            new results
          </button>
          <output data-testid="value">{value}</output>
        </>
      );
    }
    render(<Server />);
    act(() => input().focus());
    press('ArrowDown');
    press('Enter'); // Acme
    act(() => fireEvent.click(screen.getByText('new results')));
    act(() => input().blur());
    await act(() => new Promise((r) => setTimeout(r, 10)));
    // Without pinning, React Aria empties the text here while the value stays "a".
    expect(input().value).toBe('Acme');
    expect(screen.getByTestId('value').textContent).toBe('a');
  });

  it('server search: shows the picked label, and restores it when you type and leave', async () => {
    const all: ComboboxOption[] = [
      { value: 'a', label: 'Acme' },
      { value: 'c', label: 'Acorn' },
    ];
    function Server() {
      const [query, setQuery] = useState('');
      const [value, setValue] = useState<string | null>(null);
      // The "server": synchronous here, debounced + async in the story.
      const results = all.filter(
        (o) => query && o.label.toLowerCase().includes(query.toLowerCase()),
      );
      return (
        <>
          <Combobox
            aria-label="Customer"
            filter="none"
            options={results}
            onInputChange={setQuery}
            value={value}
            onChange={setValue}
          />
          <output data-testid="value">{value}</output>
        </>
      );
    }
    render(<Server />);
    act(() => input().focus());
    type('ac');
    press('ArrowDown');
    press('Enter'); // Acme
    // The bug this guards: the input kept showing the query "ac" after the pick.
    expect(input().value).toBe('Acme');
    type('zz'); // no results, and not a pick
    act(() => input().blur());
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(input().value).toBe('Acme');
    expect(screen.getByTestId('value').textContent).toBe('a');
  });

  it('shows "Loading…" while results are on their way', () => {
    render(
      <Combobox aria-label="Customer" filter="none" options={[]} loading />,
    );
    act(() => input().focus());
    type('ac');
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('renders only the visible rows of a 10,000-option list', () => {
    const many = Array.from({ length: 10_000 }, (_, i) => ({
      value: `c${i}`,
      label: `Customer ${i}`,
    }));
    render(<Combobox aria-label="Customer" options={many} />);
    act(() => input().focus());
    press('ArrowDown');
    const rendered = screen.getAllByRole('option').length;
    expect(rendered).toBeGreaterThan(0);
    expect(rendered).toBeLessThan(50);
    // Screen readers still hear the real size.
    expect(screen.getAllByRole('option')[0]?.getAttribute('aria-setsize')).toBe(
      '10000',
    );
  });

  it('posts the option value, not the visible text', () => {
    const { container } = render(
      <form>
        <Combobox
          aria-label="Country"
          options={countries}
          name="country"
          defaultValue="de"
        />
      </form>,
    );
    expect(input().value).toBe('Germany');
    expect(
      new FormData(container.querySelector('form') as HTMLFormElement).get(
        'country',
      ),
    ).toBe('de');
  });

  it('wires the Field description and error', () => {
    render(
      <Field label="Country" description="Billing country" error="Required">
        <Combobox options={countries} />
      </Field>,
    );
    const ids = (input().getAttribute('aria-describedby') ?? '').split(' ');
    const text = ids
      .map((i) => document.getElementById(i)?.textContent)
      .join(' | ');
    expect(text).toContain('Billing country');
    expect(text).toContain('Required');
  });
});
