import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useMemo, useState } from 'react';
import { Field } from '../field';
import { Combobox, type ComboboxOption } from './combobox';

const countries: ComboboxOption[] = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Côte d’Ivoire',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'India',
  'Ireland',
  'Italy',
  'Japan',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Peru',
  'Poland',
  'Portugal',
  'South Africa',
  'Spain',
  'Sweden',
  'Switzerland',
  'Türkiye',
  'United Kingdom',
  'United States',
  'Vietnam',
].map((label) => ({ value: label.toLowerCase().replace(/\W+/g, '-'), label }));

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Country',
    options: countries,
    placeholder: 'Type a country',
    filter: 'contains',
    size: 'md',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    filter: { control: 'radio', options: ['contains', 'startsWith'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Type to narrow ("ivo" finds Côte d’Ivoire: case and accents are ignored), ↑↓ to move,
 * Enter to pick, Esc to close. Focus stays in the input the whole time.
 */
export const Playground: Story = {};

export const InAField: Story = {
  render: () => (
    <Field label="Billing country" description="Used for tax." required>
      <Combobox options={countries} placeholder="Type a country" />
    </Field>
  ),
};

const tenThousand: ComboboxOption[] = Array.from(
  { length: 10_000 },
  (_, i) => ({
    value: `cust-${i + 1}`,
    label: `Customer ${String(i + 1).padStart(5, '0')}`,
  }),
);

/** 10,000 options. Only the rows you can see are in the DOM (virtualized). */
export const TenThousandOptions: Story = {
  args: {
    options: tenThousand,
    'aria-label': 'Customer',
    placeholder: 'Type a customer',
  },
};

/** A pretend API: 10k customers, 400 ms latency, abortable. */
function searchCustomers(
  query: string,
  signal: AbortSignal,
): Promise<ComboboxOption[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const q = query.trim().toLowerCase();
      resolve(
        q
          ? tenThousand
              .filter((c) => c.label.toLowerCase().includes(q))
              .slice(0, 50)
          : [],
      );
    }, 400);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

/**
 * Server search, the app's side of it. The Combobox shows what it's given; the app:
 * - debounces the request (250 ms after the last key), not the typing,
 * - aborts the previous request, so a slow old answer can't overwrite a newer one,
 * - passes `loading` and the results back in.
 * Pick a customer, then search for something else and Tab away: the input keeps the
 * picked name even though it's not in the new results.
 */
export const ServerSearch: Story = {
  render: () => {
    function Example() {
      const [query, setQuery] = useState('');
      const [results, setResults] = useState<ComboboxOption[]>([]);
      const [loading, setLoading] = useState(false);
      const [value, setValue] = useState<string | null>(null);

      useEffect(() => {
        if (!query.trim()) return setResults([]);
        const controller = new AbortController();
        setLoading(true);
        const timer = setTimeout(() => {
          searchCustomers(query, controller.signal)
            .then(setResults)
            .catch(() => undefined) // aborted: a newer request is coming
            .finally(() => !controller.signal.aborted && setLoading(false));
        }, 250);
        return () => {
          clearTimeout(timer);
          controller.abort();
        };
      }, [query]);

      const picked = useMemo(() => value ?? 'nothing', [value]);
      return (
        <div className="flex flex-col gap-2">
          <Field label="Customer" description="Try “00042” or “123”.">
            <Combobox
              filter="none"
              options={results}
              onInputChange={setQuery}
              loading={loading}
              value={value}
              onChange={setValue}
              placeholder="Search 10,000 customers"
              emptyMessage={
                query ? 'No customers found' : 'Start typing to search'
              }
            />
          </Field>
          <p className="text-sm text-fg-muted">Picked: {picked}</p>
        </div>
      );
    }
    return <Example />;
  },
};
