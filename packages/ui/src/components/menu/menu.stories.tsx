import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type SVGProps } from 'react';
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

/** Story-only icons (16×16 strokes). Apps bring their own icon set. */
function Svg({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}
const icons = {
  edit: <Svg d="M10.5 2.5l3 3-8 8h-3v-3z" />,
  copy: <Svg d="M5.5 5.5h8v8h-8zM2.5 10.5v-8h8" />,
  send: <Svg d="M14 2 7 9M14 2l-4.5 12-2.5-5-5-2.5z" />,
  download: <Svg d="M8 2.5v8M4.5 7 8 10.5 11.5 7M2.5 13.5h11" />,
  archive: <Svg d="M2.5 3.5h11v3h-11zM3.5 6.5v7h9v-7M6.5 9h3" />,
  trash: <Svg d="M2.5 4.5h11M6 4.5v-2h4v2M4 4.5l.5 9h7l.5-9" />,
};

/**
 * `icon` on items: a small leading icon, hidden from screen readers (the text says
 * it all). The danger item turns soft red when focused: press ↓ to Delete and see.
 */
export const WithIcons: Story = {
  render: () => (
    <Menu label="Actions" intent="secondary">
      <MenuItem icon={icons.edit} shortcut="E">
        Edit
      </MenuItem>
      <MenuItem icon={icons.copy} shortcut="Ctrl+D">
        Duplicate
      </MenuItem>
      <MenuItem icon={icons.send}>Send reminder</MenuItem>
      <MenuSubmenu label="Export as" icon={icons.download}>
        <MenuItem>CSV</MenuItem>
        <MenuItem>Excel</MenuItem>
        <MenuItem>PDF</MenuItem>
      </MenuSubmenu>
      <MenuSeparator />
      <MenuItem icon={icons.archive} disabled>
        Archive
      </MenuItem>
      <MenuItem icon={icons.trash} intent="danger" shortcut="Del">
        Delete
      </MenuItem>
    </Menu>
  ),
};

/**
 * `menuSize="sm"`: tighter rows for dense screens, like row actions in a data grid.
 * Every item, header and submenu inside follows it.
 */
export const Dense: Story = {
  render: () => (
    <div className="flex w-96 items-center justify-between rounded-md border border-border px-3 py-1 text-xs">
      <span>INV-10042 · Northwind Traders</span>
      <Menu
        label={<span aria-hidden="true">⋯</span>}
        aria-label="Actions for INV-10042"
        intent="ghost"
        size="sm"
        chevron={false}
        placement="bottom end"
        menuSize="sm"
      >
        <MenuSection title="Invoice">
          <MenuItem icon={icons.edit}>Edit</MenuItem>
          <MenuItem
            icon={icons.send}
            description="To billing@northwind.example"
          >
            Send reminder
          </MenuItem>
          <MenuItem icon={icons.download} shortcut="Ctrl+P">
            Download PDF
          </MenuItem>
        </MenuSection>
        <MenuSeparator />
        <MenuItem icon={icons.trash} intent="danger">
          Void
        </MenuItem>
      </Menu>
    </div>
  ),
};
