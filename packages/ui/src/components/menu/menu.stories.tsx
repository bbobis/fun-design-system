import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AlertDialog } from '../dialog';
import {
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuSubmenu,
} from './menu';

const meta = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Actions', children: null },
  decorators: [
    (Story) => (
      <div className="min-h-72">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tab to the button, press ↓ (or Enter): focus lands on the first item. Arrows move,
 * a letter jumps ("D" → Duplicate), Enter runs, Escape closes and returns focus.
 * Archive is disabled: arrows skip it, but it's still announced.
 */
export const Actions: Story = {
  render: () => {
    function Example() {
      const [last, setLast] = useState('—');
      return (
        <div className="flex items-start gap-4">
          <Menu label="Actions">
            <MenuItem onAction={() => setLast('Edit')}>Edit</MenuItem>
            <MenuItem
              onAction={() => setLast('Duplicate')}
              shortcut="Ctrl+D"
              description="Copies the lines, not the payments"
            >
              Duplicate
            </MenuItem>
            <MenuItem disabled>Archive</MenuItem>
            <MenuSeparator />
            <MenuItem intent="danger" onAction={() => setLast('Delete')}>
              Delete
            </MenuItem>
          </Menu>
          <span className="text-sm text-fg-muted">Last action: {last}</span>
        </div>
      );
    }
    return <Example />;
  },
};

/** An icon-only trigger, as on a grid row. `aria-label` names it; `placement="bottom end"` keeps it on screen at the right edge. */
export const RowActions: Story = {
  render: () => (
    <div className="flex w-96 items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
      <span>INV-10042 · Northwind Traders</span>
      <Menu
        label={<span aria-hidden="true">⋯</span>}
        aria-label="Actions for INV-10042"
        intent="ghost"
        size="sm"
        chevron={false}
        placement="bottom end"
      >
        <MenuItem>Open</MenuItem>
        <MenuItem>Send reminder</MenuItem>
        <MenuSeparator />
        <MenuItem intent="danger">Void</MenuItem>
      </Menu>
    </div>
  ),
};

/**
 * Checkable sections: "Columns" is `multiple` (checkboxes), "Density" is `single`
 * (radio). Toggling keeps the menu open, so you can change several things at once.
 */
export const ViewOptions: Story = {
  render: () => {
    function Example() {
      const [columns, setColumns] = useState(['customer', 'status', 'total']);
      const [density, setDensity] = useState(['standard']);
      return (
        <div className="flex items-start gap-4">
          <Menu label="View">
            <MenuSection
              title="Columns"
              selectionMode="multiple"
              selectedKeys={columns}
              onSelectionChange={setColumns}
            >
              <MenuItem id="customer">Customer</MenuItem>
              <MenuItem id="status">Status</MenuItem>
              <MenuItem id="due">Due</MenuItem>
              <MenuItem id="total">Total</MenuItem>
            </MenuSection>
            <MenuSeparator />
            <MenuSection
              title="Density"
              selectionMode="single"
              selectedKeys={density}
              onSelectionChange={(keys) => keys.length && setDensity(keys)}
            >
              <MenuItem id="compact">Compact</MenuItem>
              <MenuItem id="standard">Standard</MenuItem>
            </MenuSection>
          </Menu>
          <span className="text-sm text-fg-muted">
            Columns: {columns.join(', ')} · Density: {density[0]}
          </span>
        </div>
      );
    }
    return <Example />;
  },
};

/** A destructive item that asks first: the menu closes, then an AlertDialog opens. */
export const WithConfirm: Story = {
  render: () => {
    function Example() {
      const [confirming, setConfirming] = useState(false);
      return (
        <>
          <Menu label="Actions">
            <MenuItem>Edit</MenuItem>
            <MenuItem intent="danger" onAction={() => setConfirming(true)}>
              Delete…
            </MenuItem>
          </Menu>
          <AlertDialog
            open={confirming}
            onOpenChange={setConfirming}
            title="Delete INV-10042?"
            description="This can't be undone."
            confirmLabel="Delete invoice"
            onConfirm={() => undefined}
          />
        </>
      );
    }
    return <Example />;
  },
};

/**
 * `MenuSubmenu`: "Export as ▸" opens a second menu beside it. Keyboard: → opens it,
 * ← or Escape closes just the submenu, Enter on an item runs it and closes everything.
 */
export const WithSubmenu: Story = {
  render: () => (
    <div className="pb-40">
      <Menu label="Actions" intent="secondary">
        <MenuItem>Edit</MenuItem>
        <MenuItem shortcut="Ctrl+D">Duplicate</MenuItem>
        <MenuSubmenu label="Export as">
          <MenuItem description="Opens in Excel or Sheets">CSV</MenuItem>
          <MenuItem>Excel</MenuItem>
          <MenuItem>PDF</MenuItem>
        </MenuSubmenu>
        <MenuSeparator />
        <MenuItem intent="danger">Delete</MenuItem>
      </Menu>
    </div>
  ),
};
