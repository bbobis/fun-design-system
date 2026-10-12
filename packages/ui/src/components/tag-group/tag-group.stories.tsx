import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { TagGroup, type TagItem } from './tag-group';

const meta = {
  title: 'Components/TagGroup',
  component: TagGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Tags', items: [] },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TagGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const filters: TagItem[] = [
  { id: 'status', label: 'Status: Open' },
  { id: 'owner', label: 'Owner: Me' },
  { id: 'due', label: 'Due: This week' },
  { id: 'amount', label: 'Amount > $1,000' },
];

/**
 * Active filters. Tab into the chips, ←/→ to move, Delete or Backspace to remove (or
 * click ✕). Remove them all to see the empty text.
 */
export const RemovableFilters: Story = {
  render: function Render() {
    const [items, setItems] = useState(filters);
    return (
      <div className="flex flex-col items-start gap-3">
        <TagGroup
          label="Active filters"
          items={items}
          onRemove={(ids) =>
            setItems((current) => current.filter((i) => !ids.includes(i.id)))
          }
          emptyText="No filters. Showing every invoice."
        />
        <Button intent="secondary" size="sm" onClick={() => setItems(filters)}>
          Reset filters
        </Button>
      </div>
    );
  },
};

const statuses: TagItem[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'void', label: 'Void', disabled: true },
];

/** `selectionMode="multiple"`: filter choices you toggle with a click, Space or Enter. */
export const Selectable: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['sent', 'overdue']);
    return (
      <div className="flex flex-col gap-2">
        <TagGroup
          label="Status"
          size="md"
          items={statuses}
          selectionMode="multiple"
          selectedIds={selected}
          onSelectionChange={setSelected}
          description="Void invoices can't be filtered yet."
        />
        <p className="text-sm text-fg-muted">
          Selected: <code>{JSON.stringify(selected)}</code>
        </p>
      </div>
    );
  },
};

/** No chips: `emptyText` stands in. */
export const Empty: Story = {
  args: { label: 'Recipients', items: [], emptyText: 'No one yet.' },
};

export const WithError: Story = {
  args: {
    label: 'Recipients',
    items: [{ id: 'a', label: 'ana@example.com' }],
    error: 'Add at least one person from Finance.',
  },
};
