import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { Button } from '../button';
import { DataGrid } from './data-grid';
import type { ChangeSet } from './editing/contract';
import { invoiceColumns } from './fixtures/invoice-columns';
import { makeInvoices, type Invoice } from './fixtures/invoices';

// Generated once at module load, so switching stories doesn't regenerate 10k rows.
const tenThousand = makeInvoices(10_000);
const twentyFive = tenThousand.slice(0, 25);
const getRowId = (row: Invoice) => row.id;

// `typeof DataGrid<Invoice>` (an instantiation expression) tells Storybook which row
// type these stories use, so args stay fully typed for a generic component.
const meta = {
  title: 'Components/DataGrid',
  component: DataGrid<Invoice>,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Invoices',
    data: tenThousand,
    columns: invoiceColumns,
    getRowId,
  },
} satisfies Meta<typeof DataGrid<Invoice>>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 10,000 rows × 20 columns. Only the rows in view are rendered; scroll, sort and
 * search. Tick a few rows to see the bulk-action bar.
 */
export const TenThousandRows: Story = {
  args: {
    title: 'Invoices',
    enableRowSelection: true,
    className: 'h-[36rem]',
    toolbarActions: (
      <Button size="sm" intent="primary">
        New invoice
      </Button>
    ),
    renderBulkActions: ({ selectedRowIds, clearSelection }) => (
      <>
        <Button
          size="sm"
          intent="secondary"
          onClick={() => console.info('Export', selectedRowIds)}
        >
          Export
        </Button>
        <Button
          size="sm"
          intent="secondary"
          onClick={() => {
            console.info('Mark as paid', selectedRowIds);
            clearSelection();
          }}
        >
          Mark as paid
        </Button>
      </>
    ),
  },
};

/** Without a title or actions: just search, the count and the grid. */
export const Minimal: Story = {
  args: {
    data: twentyFive,
    className: 'h-96',
  },
};

/** Selection owned by the app: the count below the grid comes from app state. */
export const ControlledSelection: Story = {
  render: () => {
    function Example() {
      const [selection, setSelection] = useState<RowSelectionState>({});
      return (
        <div className="flex flex-col gap-2">
          <DataGrid
            aria-label="Invoices"
            title="Invoices"
            data={twentyFive}
            columns={invoiceColumns}
            getRowId={getRowId}
            enableRowSelection
            rowSelection={selection}
            onRowSelectionChange={setSelection}
            density="standard"
            className="h-80"
          />
          <p className="text-sm text-fg-muted">
            App state: {Object.keys(selection).join(', ') || 'nothing selected'}
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

export const Empty: Story = {
  args: {
    data: [],
    emptyMessage: 'No invoices yet. New invoices appear here.',
    className: 'h-48',
  },
};

/** Applies a ChangeSet to the demo rows, the way a real API response would. */
function applyChanges(rows: Invoice[], changes: ChangeSet): Invoice[] {
  const byId = new Map(
    changes.operations.flatMap((op) =>
      op.op === 'update' ? [[op.id, op.changes] as const] : [],
    ),
  );
  return rows.map((row) =>
    byId.has(row.id) ? { ...row, ...byId.get(row.id) } : row,
  );
}

const isPaid = (row: Invoice) => row.status === 'Paid';

/**
 * Click **Edit table**, then work like a spreadsheet: arrows, type to replace,
 * Enter/F2 to edit, Enter/Tab to commit and move, Esc to cancel. Nothing is saved until
 * **Save all** (the request is logged to the browser console). Paid rows are locked.
 */
export const Editable: Story = {
  render: () => {
    function Example() {
      const [rows, setRows] = useState(() => tenThousand.slice(0, 500));
      return (
        <DataGrid
          aria-label="Invoices"
          title="Invoices"
          data={rows}
          columns={invoiceColumns}
          getRowId={getRowId}
          density="standard"
          className="h-[36rem]"
          editing={{
            isRowLocked: isPaid,
            onSave: async (changes) => {
              console.info('onSave', changes);
              await new Promise((r) => setTimeout(r, 600));
              setRows((prev) => applyChanges(prev, changes));
              return { ok: true };
            },
          }}
        />
      );
    }
    return <Example />;
  },
};

/** The server is down: Save fails, the draft is kept, and the bar says so. */
export const SaveFails: Story = {
  render: () => (
    <DataGrid
      aria-label="Invoices"
      title="Invoices"
      data={twentyFive}
      columns={invoiceColumns}
      getRowId={getRowId}
      className="h-96"
      editing={{
        onSave: async () => {
          await new Promise((r) => setTimeout(r, 400));
          throw new Error('503 Service Unavailable');
        },
      }}
    />
  ),
};
