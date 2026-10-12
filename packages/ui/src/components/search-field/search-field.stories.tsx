import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Dialog } from '../dialog';
import { Field } from '../field';
import { SearchField } from './search-field';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Search invoices', placeholder: 'Search invoices' },
  argTypes: { size: { control: 'radio', options: ['sm', 'md', 'lg'] } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type, then Escape (or the ✕) to clear. Enter submits. */
export const Playground: Story = { args: { defaultValue: 'Acme' } };

const customers = [
  'Acme Corp',
  'Brightline Logistics',
  'Cobalt Health',
  'Delta Foods',
  'Evergreen Energy',
  'Fjord Analytics',
];

/** Filters a list as you type; the count is announced (role="status"). */
export const FilterList: Story = {
  render: function Render() {
    const [query, setQuery] = useState('');
    const matches = customers.filter((c) =>
      c.toLowerCase().includes(query.trim().toLowerCase()),
    );
    return (
      <div className="flex flex-col gap-3">
        <Field label="Customers">
          <SearchField
            placeholder="Filter by name"
            value={query}
            onChange={setQuery}
          />
        </Field>
        <p role="status" className="text-sm text-fg-muted">
          {matches.length} of {customers.length} customers
        </p>
        <ul className="flex flex-col gap-1 text-sm text-fg">
          {matches.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>
    );
  },
};

/** `loading`: a spinner instead of the 🔍 while results come back. */
export const Loading: Story = {
  args: { defaultValue: 'Brightline', loading: true },
};

export const WithError: Story = {
  render: () => (
    <Field label="Invoice number" error="Use the format INV-1234.">
      <SearchField defaultValue="1234" />
    </Field>
  ),
};

/**
 * Inside a Dialog: the first Escape clears the search, the next one closes the dialog.
 */
export const InDialog: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Pick a customer</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Pick a customer">
          <SearchField
            aria-label="Search customers"
            defaultValue="Acme"
            placeholder="Search customers"
          />
        </Dialog>
      </>
    );
  },
};
