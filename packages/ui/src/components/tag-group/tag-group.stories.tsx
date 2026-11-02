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

const toneStatuses: TagItem[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent', tone: 'info' },
  { id: 'paid', label: 'Paid', tone: 'success' },
  { id: 'due-soon', label: 'Due soon', tone: 'warning' },
  { id: 'overdue', label: 'Overdue', tone: 'danger' },
];

/**
 * `tone` per tag, for statuses. The label still says the status; color is extra. The
 * ✕ takes the tone's text color, so it keeps its contrast on the tinted fill.
 */
export const Tones: Story = {
  render: function Render() {
    const [items, setItems] = useState(toneStatuses);
    return (
      <div className="flex flex-col gap-6">
        <TagGroup label="Invoice statuses" items={toneStatuses} />
        <TagGroup
          label="Removable"
          items={items}
          size="md"
          onRemove={(ids) =>
            setItems((i) => i.filter((x) => !ids.includes(x.id)))
          }
        />
      </div>
    );
  },
};

/** Story-only avatar: initials in a circle. Apps bring their own. */
function Initials({ name }: { name: string }) {
  return (
    <span className="flex items-center justify-center rounded-full bg-primary text-[0.5rem] font-semibold text-on-primary">
      {name
        .split(' ')
        .map((w) => w[0])
        .join('')}
    </span>
  );
}

const recipients: TagItem[] = [
  { id: 'ana', label: 'Ana Ruiz', icon: <Initials name="Ana Ruiz" /> },
  { id: 'sam', label: 'Sam Lee', icon: <Initials name="Sam Lee" /> },
  { id: 'kim', label: 'Kim Park', icon: <Initials name="Kim Park" /> },
];

/**
 * `shape="pill"` + an `icon` per tag: recipients with initials. The initials are
 * hidden from screen readers: the label already says the name.
 */
export const PillsWithIcons: Story = {
  render: function Render() {
    const [items, setItems] = useState(recipients);
    return (
      <TagGroup
        label="Recipients"
        items={items}
        shape="pill"
        size="md"
        onRemove={(ids) =>
          setItems((i) => i.filter((x) => !ids.includes(x.id)))
        }
      />
    );
  },
};

/** Selectable pills: a ✓ and the primary tint show what's on, whatever the tone. */
export const SelectablePills: Story = {
  args: {
    label: 'Show',
    items: toneStatuses,
    shape: 'pill',
    selectionMode: 'multiple',
    defaultSelectedIds: ['paid', 'overdue'],
  },
};
