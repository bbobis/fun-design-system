import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Field } from '../field';
import { Input } from '../input';
import { Select, type SelectOption } from './select';

const statuses: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid', disabled: true },
];

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Status',
    options: statuses,
    placeholder: 'Choose a status',
    size: 'md',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tab to it, then: ↓ or Space opens, ↑↓ move, a letter jumps ("o" → Overdue), Enter
 * picks, Esc closes. Focus comes back to the button. "Paid" is disabled.
 */
export const Playground: Story = {};

/** Inside a Field: the label names it, the description and error are read on focus. */
export const InAField: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Field label="Status" description="Where the invoice is in the workflow.">
        <Select options={statuses} placeholder="Choose a status" />
      </Field>
      <Field label="Status" error="Pick a status before saving." required>
        <Select options={statuses} placeholder="Choose a status" />
      </Field>
    </div>
  ),
};

/** Same heights as Input and Button, so a filter row lines up. */
export const Sizes: Story = {
  decorators: [
    (Story) => (
      <div className="w-full">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex items-center gap-2">
          <Input
            size={size}
            aria-label="Search"
            placeholder="Search"
            className="w-48"
          />
          <Select
            size={size}
            aria-label="Status"
            options={statuses}
            defaultValue="pending"
            className="w-40"
          />
          <Button size={size} intent="secondary">
            Apply
          </Button>
        </div>
      ))}
    </div>
  ),
};

/** Owned by the app: the value lives in React state. */
export const Controlled: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState<string | null>('overdue');
      return (
        <div className="flex flex-col gap-2">
          <Field label="Status">
            <Select options={statuses} value={value} onChange={setValue} />
          </Field>
          <p className="text-sm text-fg-muted">App state: {value ?? 'null'}</p>
        </div>
      );
    }
    return <Example />;
  },
};

const countries: SelectOption[] = [
  'Argentina',
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'India',
  'Indonesia',
  'Ireland',
  'Italy',
  'Japan',
  'Kenya',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'South Africa',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'Ukraine',
  'United Kingdom',
  'United States',
  'Vietnam',
].map((name) => ({
  value: name.toLowerCase().replaceAll(' ', '-'),
  label: name,
}));

/**
 * A longer list scrolls inside the popup. Type "un" quickly to jump to "United
 * Kingdom": typeahead matches several letters typed in a row. For hundreds of options
 * or search, use Combobox instead.
 */
export const LongList: Story = {
  args: {
    options: countries,
    'aria-label': 'Country',
    placeholder: 'Choose a country',
  },
};
