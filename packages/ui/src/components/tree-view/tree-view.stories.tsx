import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type SVGProps } from 'react';
import { TreeView, type TreeNode } from './tree-view';

const meta = {
  title: 'Components/TreeView',
  component: TreeView,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Files', nodes: [] },
} satisfies Meta<typeof TreeView>;

export default meta;
type Story = StoryObj<typeof meta>;

const Svg = (p: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinejoin="round"
    className="size-4"
    {...p}
  />
);
const Folder = () => (
  <Svg>
    <path d="M1.75 4.25v8h12.5v-6.5H7.5L6 4.25z" />
  </Svg>
);
const File = () => (
  <Svg>
    <path d="M4 1.75h5.5L12.25 4.5v9.75H4zM9.25 1.75V4.75h3" />
  </Svg>
);

const folder = (id: string, label: string, children: TreeNode[]): TreeNode => ({
  id,
  label,
  icon: <Folder />,
  meta: `${children.length}`,
  children,
});
const file = (id: string, label: string, disabled = false): TreeNode => ({
  id,
  label,
  icon: <File />,
  disabled,
});

const files: TreeNode[] = [
  folder('billing', 'Billing', [
    folder('invoices', 'Invoices', [
      file('inv-1042', 'INV-1042.pdf'),
      file('inv-1043', 'INV-1043.pdf'),
      file('inv-1044', 'INV-1044.pdf'),
    ]),
    folder('receipts', 'Receipts', [file('rcpt-77', 'RCPT-77.pdf')]),
    file('terms', 'Payment terms.docx'),
  ]),
  folder('customers', 'Customers', [
    file('northwind', 'Northwind Traders.csv'),
    file('acme', 'Acme Corp.csv'),
  ]),
  folder('archive', 'Archive (read-only)', [file('old', '2019.zip', true)]),
];

/**
 * Files, single selection. Click or Space selects (highlight + ✓); Enter "opens".
 * Keyboard: ↑/↓, → open folder / step in, ← close / step out, Home/End, type to jump.
 */
export const Files: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['inv-1043']);
    const [opened, setOpened] = useState('nothing yet');
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <TreeView
          aria-label="Files"
          nodes={files}
          defaultExpanded={['billing', 'invoices']}
          selectionMode="single"
          selected={selected}
          onSelectionChange={setSelected}
          onAction={(id) => setOpened(id)}
          className="rounded-md border border-border p-1"
        />
        <p className="text-sm text-fg-muted">
          Selected: <code>{JSON.stringify(selected)}</code> · Opened:{' '}
          <code>{opened}</code>
        </p>
      </div>
    );
  },
};

/** `selectionMode="multiple"`: a checkbox on every row. Space toggles the focused row. */
export const MultipleSelection: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(['inv-1042', 'acme']);
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <TreeView
          aria-label="Files to export"
          nodes={files}
          defaultExpanded={['billing', 'invoices', 'customers']}
          selectionMode="multiple"
          selected={selected}
          onSelectionChange={setSelected}
          className="rounded-md border border-border p-1"
        />
        <p className="text-sm text-fg-muted">
          {selected.length} selected: <code>{JSON.stringify(selected)}</code>
        </p>
      </div>
    );
  },
};

const person = (
  id: string,
  label: string,
  title: string,
  reports?: TreeNode[],
): TreeNode => ({
  id,
  label,
  meta: reports ? `${title} · ${reports.length}` : title,
  children: reports,
});
const org: TreeNode[] = [
  person('ceo', 'Ana Silva', 'CEO', [
    person('cfo', 'Ben Bobis', 'CFO', [
      person('ar', 'Dana Okafor', 'Receivables'),
      person('ap', 'Chen Wei', 'Payables'),
    ]),
    person('cto', 'Eli Moreau', 'CTO', [
      person('eng', 'Farah Khan', 'Engineering'),
    ]),
  ]),
];

/** No selection: rows just act. Enter or a click "opens" a person (`onAction`). */
export const OrgChart: Story = {
  render: function Render() {
    const [opened, setOpened] = useState('nobody yet');
    return (
      <div className="flex max-w-sm flex-col gap-3">
        <TreeView
          aria-label="Org chart"
          nodes={org}
          defaultExpanded={['ceo', 'cfo']}
          onAction={setOpened}
        />
        <p className="text-sm text-fg-muted">
          Opened: <code>{opened}</code>
        </p>
      </div>
    );
  },
};

/** Long trees scroll inside their box; the focus ring is drawn inside the row so it isn't clipped. */
export const Scrolling: Story = {
  render: () => (
    <TreeView
      aria-label="Invoices by month"
      defaultExpanded={['m-0', 'm-1']}
      nodes={Array.from({ length: 12 }, (_, m) =>
        folder(
          `m-${m}`,
          new Date(2026, m, 1).toLocaleString('en', { month: 'long' }),
          Array.from({ length: 6 }, (_, i) =>
            file(`m-${m}-${i}`, `INV-${m}${i}.pdf`),
          ),
        ),
      )}
      selectionMode="single"
      className="max-h-64 max-w-sm rounded-md border border-border p-1"
    />
  ),
};

/** No nodes: the empty state. */
export const Empty: Story = {
  args: {
    'aria-label': 'Files',
    nodes: [],
    emptyState: 'No files yet. Upload one to start.',
  },
  render: (args) => (
    <TreeView
      {...args}
      className="max-w-sm rounded-md border border-border p-1"
    />
  ),
};
