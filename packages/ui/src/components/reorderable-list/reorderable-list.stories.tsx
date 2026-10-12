import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from '../switch';
import { ReorderableList, type ReorderableItem } from './reorderable-list';

const meta = {
  title: 'Components/ReorderableList',
  component: ReorderableList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Column order', items: [], onReorder: () => undefined },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReorderableList>;

export default meta;
type Story = StoryObj<typeof meta>;

const columns: ReorderableItem[] = [
  { id: 'invoice', label: 'Invoice' },
  { id: 'customer', label: 'Customer', description: 'Company name' },
  { id: 'status', label: 'Status' },
  { id: 'issued', label: 'Issued' },
  { id: 'due', label: 'Due date' },
  { id: 'total', label: 'Total' },
];

/**
 * Drag a row by its ⠿ handle. Keyboard: ↑↓ to a row, → onto its handle, Enter to pick
 * it up, ↑↓ through the gaps ("Insert between …"), Enter to drop (Escape cancels).
 * Shortcut: Alt+↑/↓ on a row moves it one step.
 */
export const Default: Story = {
  render: function Render() {
    const [items, setItems] = useState(columns);
    return (
      <div className="flex flex-col gap-3">
        <ReorderableList
          aria-label="Column order"
          items={items}
          onReorder={setItems}
        />
        <p className="text-sm text-fg-muted">
          Order: {items.map((i) => i.label).join(' → ')}
        </p>
      </div>
    );
  },
};

/** `renderEnd`: a Switch per row, like a "Choose columns" panel. */
export const WithSwitches: Story = {
  render: function Render() {
    const [items, setItems] = useState(columns);
    const [hidden, setHidden] = useState<string[]>(['issued']);
    return (
      <ReorderableList
        aria-label="Columns"
        items={items}
        onReorder={setItems}
        renderEnd={(item) => (
          <Switch
            checked={!hidden.includes(item.id)}
            onChange={(on) =>
              setHidden((h) =>
                on ? h.filter((x) => x !== item.id) : [...h, item.id],
              )
            }
          >
            {/* The row already shows the name; screen readers still hear "Show …". */}
            <span className="sr-only">Show {item.label}</span>
          </Switch>
        )}
      />
    );
  },
};
