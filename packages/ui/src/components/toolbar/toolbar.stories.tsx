import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SVGProps } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { Menu, MenuItem } from '../menu';
import { Tooltip } from '../tooltip';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from './toolbar';

const meta = {
  title: 'Components/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Toolbar', children: null },
} satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Above a table: one Tab stop for all the actions. Tab in, ←/→ to move, Tab out to the
 * search box. Shift+Tab comes back to the button you last used.
 */
export const TableActions: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Toolbar aria-label="Invoice actions">
        <ToolbarGroup aria-label="Edit">
          <Button size="sm">New invoice</Button>
          <Button size="sm" intent="secondary">
            Duplicate
          </Button>
          <Button size="sm" intent="secondary">
            Archive
          </Button>
        </ToolbarGroup>
        <ToolbarSeparator />
        <Menu label="Export" intent="secondary" size="sm">
          <MenuItem>CSV</MenuItem>
          <MenuItem>PDF</MenuItem>
        </Menu>
        <Button size="sm" intent="ghost">
          Print
        </Button>
      </Toolbar>
      <Input aria-label="Search invoices" placeholder="Search invoices" />
    </div>
  ),
};

const Svg = (p: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-4"
    {...p}
  />
);
const icons = {
  zoomIn: (
    <Svg>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3M5 7h4M7 5v4" />
    </Svg>
  ),
  zoomOut: (
    <Svg>
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3M5 7h4" />
    </Svg>
  ),
  rotate: (
    <Svg>
      <path d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3" />
    </Svg>
  ),
  download: (
    <Svg>
      <path d="M8 2.5v8m0 0-3-3m3 3 3-3M2.5 13.5h11" />
    </Svg>
  ),
  print: (
    <Svg>
      <path d="M4.5 6V2.5h7V6M4.5 11h-2V6h11v5h-2M4.5 9h7v4.5h-7z" />
    </Svg>
  ),
};

function IconButton({
  label,
  icon,
  placement,
}: {
  label: string;
  icon: keyof typeof icons;
  placement?: 'top' | 'end';
}) {
  return (
    <Tooltip content={label} kind="label" placement={placement}>
      <Button size="sm" intent="ghost" aria-label={label} className="px-2">
        {icons[icon]}
      </Button>
    </Tooltip>
  );
}

/** Icon-only buttons: each has an aria-label, and a tooltip shows it on hover or focus. */
export const IconButtons: Story = {
  render: () => (
    <Toolbar
      aria-label="Document"
      className="w-fit rounded-md border border-border p-1"
    >
      <ToolbarGroup aria-label="Zoom">
        <IconButton label="Zoom in" icon="zoomIn" />
        <IconButton label="Zoom out" icon="zoomOut" />
      </ToolbarGroup>
      <ToolbarSeparator />
      <IconButton label="Rotate" icon="rotate" />
      <ToolbarSeparator />
      <IconButton label="Download" icon="download" />
      <IconButton label="Print" icon="print" />
    </Toolbar>
  ),
};

/**
 * `orientation="vertical"`: ↑/↓ move; separators turn horizontal. Tooltips open to the
 * side (`placement="end"`) so they don't cover the neighbouring buttons.
 */
export const Vertical: Story = {
  render: () => (
    <Toolbar
      aria-label="Document"
      orientation="vertical"
      className="w-fit rounded-md border border-border p-1"
    >
      <IconButton label="Zoom in" icon="zoomIn" placement="end" />
      <IconButton label="Zoom out" icon="zoomOut" placement="end" />
      <ToolbarSeparator />
      <IconButton label="Download" icon="download" placement="end" />
      <IconButton label="Print" icon="print" placement="end" />
    </Toolbar>
  ),
};
