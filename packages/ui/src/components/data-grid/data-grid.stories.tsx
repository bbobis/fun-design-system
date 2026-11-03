import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { Button } from '../button';
import { DataGrid } from './data-grid';
import { queryInvoices } from './fixtures/fake-server';
import { initialQuery, type DataGridQuery } from './server-query';
import type { DataGridColumnState } from './column-state';
import type { ChangeSet, SaveResult } from './editing/contract';
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

/**
 * The table looks: `density="comfortable"` (48px rows), `striped`, `gridLines="all"`
 * and `pinFirstColumn`. Scroll sideways: the checkbox and invoice-number columns stay,
 * with a line on their edge. Hover or tick a row: the pinned cells change with it.
 */
export const Styles: Story = {
  args: {
    title: 'Invoices',
    data: tenThousand.slice(0, 200),
    enableRowSelection: true,
    density: 'comfortable',
    striped: true,
    gridLines: 'all',
    pinFirstColumn: true,
    className: 'h-[30rem] max-w-3xl',
  },
};

/** A starting layout: Invoice pinned to the start, Total to the end, Record ID hidden. */
const startingLayout: DataGridColumnState = {
  // Accessor columns are identified by their field name.
  order: invoiceColumns.map(
    (c) => c.id ?? (c as { accessorKey?: string }).accessorKey ?? '',
  ),
  hidden: ['id'],
  pinned: { start: ['number'], end: ['total'] },
};

/**
 * The column menu. Hover a header (or Tab to it) for its ⌄ button: sort, pin to start
 * or end, move left or right, hide. "Columns ▾" in the toolbar shows hidden columns
 * again, or resets the layout.
 *
 * The layout is **controlled** here: the app keeps it in state (it could save it to
 * localStorage or a server), and the JSON below is what `onColumnStateChange` sent.
 */
export const ColumnLayout: Story = {
  render: function Render(args) {
    const [layout, setLayout] = useState(startingLayout);
    return (
      <div className="flex flex-col gap-3">
        <DataGrid
          {...args}
          title="Invoices"
          data={tenThousand.slice(0, 200)}
          enableRowSelection
          columnState={layout}
          onColumnStateChange={setLayout}
          defaultColumnState={startingLayout}
          className="h-[26rem] max-w-4xl"
        />
        <pre className="max-w-4xl overflow-auto rounded-md bg-surface p-3 text-xs text-fg-muted">
          {JSON.stringify(
            {
              hidden: layout.hidden,
              pinned: layout.pinned,
            },
            null,
            1,
          )}
        </pre>
      </div>
    );
  },
};

/**
 * Resize and remember. Drag a column's edge (double-click it to fit the content), or
 * use "Resize column" in the ⌄ menu and press ←/→ (Shift for bigger steps), Enter to
 * finish. `stateKey="storybook-invoices"` saves the layout in this browser: change
 * it, reload the page, and it's still there. "Columns ▾ → Reset columns" forgets it.
 */
export const RememberedLayout: Story = {
  args: {
    title: 'Invoices',
    data: tenThousand.slice(0, 200),
    stateKey: 'storybook-invoices',
    pinFirstColumn: true,
    className: 'h-[26rem] max-w-4xl',
  },
};

/**
 * Column filters. Customer (text), Status and Region (lists), Issued (dates) and
 * Total (min – max) have `meta.filter`: open a column's ⌄ menu and pick "Filter…".
 * Active filters show as chips above the grid (Delete or Backspace removes one) and
 * a funnel on the header; the footer counts "N of 10,000 rows".
 */
export const Filters: Story = {
  args: {
    title: 'Invoices',
    defaultFilters: {
      status: { kind: 'list', values: ['Overdue', 'Pending'] },
      total: { kind: 'number', min: 20000 },
    },
    className: 'h-[30rem] max-w-5xl',
  },
};

/**
 * **Server mode.** The grid only ever has one page (`data`); sorting, the column
 * filters, search and paging become a `DataGridQuery`, and this story's fake server
 * answers it after 300 ms (watch "Loading…"). Change a filter on page 5: you land on
 * page 1. The query the grid sent is shown below.
 */
export const ServerMode: Story = {
  render: function Render(args) {
    const [query, setQuery] = useState<DataGridQuery>(() => initialQuery(50));
    const [page, setPage] = useState(() => queryInvoices(tenThousand, query));
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      // A real app: fetch(`/api/invoices?${toSpringParams(query)}`, { signal }).
      setLoading(true);
      const t = setTimeout(() => {
        setPage(queryInvoices(tenThousand, query));
        setLoading(false);
      }, 300);
      // A newer query cancels the older answer, like an AbortController would.
      return () => clearTimeout(t);
    }, [query]);
    return (
      <div className="flex flex-col gap-3">
        <DataGrid
          {...args}
          title="Invoices"
          data={page.content}
          server={{
            query,
            onQueryChange: setQuery,
            rowCount: page.page.totalElements,
            loading,
          }}
          className="h-[30rem] max-w-5xl"
        />
        <pre className="max-w-5xl overflow-auto rounded-md bg-surface p-3 text-xs text-fg-muted">
          {JSON.stringify(query)}
        </pre>
      </div>
    );
  },
};

/** Side by side: compact (default), standard and comfortable. */
export const Densities: Story = {
  render: () => (
    <div className="grid gap-4 lg:grid-cols-3">
      {(['compact', 'standard', 'comfortable'] as const).map((density) => (
        <DataGrid
          key={density}
          aria-label={`Invoices (${density})`}
          title={density}
          data={twentyFive}
          columns={invoiceColumns.slice(0, 4)}
          getRowId={getRowId}
          density={density}
          striped
          className="h-80"
        />
      ))}
    </div>
  ),
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
  const deleted = new Set(
    changes.operations.flatMap((op) => (op.op === 'delete' ? [op.id] : [])),
  );
  const updated = rows
    .filter((row) => !deleted.has(row.id))
    .map((row) => (byId.has(row.id) ? { ...row, ...byId.get(row.id) } : row));
  // New rows get a real id and number, as a server would assign.
  const created = changes.operations.flatMap((op, i) =>
    op.op === 'create'
      ? [
          {
            ...blankInvoice,
            ...op.values,
            id: `new-${rows.length + i + 1}`,
            number: `INV-${20_000 + rows.length + i + 1}`,
          } as Invoice,
        ]
      : [],
  );
  return [...updated, ...created];
}

/** What a server fills in for a new invoice the user didn't type. */
const blankInvoice: Partial<Invoice> = {
  issued: '2026-10-04',
  due: '2026-11-03',
  tax: 0,
  total: 0,
  currency: 'CAD',
  emailed: false,
};

const isPaid = (row: Invoice) => row.status === 'Paid';

/**
 * Click **Edit table**, then work like a spreadsheet: arrows, type to replace,
 * Enter/F2 to edit, Enter/Tab to commit and move, Esc to cancel. Nothing is saved until
 * **Save all** (the request is logged to the browser console). Paid rows are locked.
 * Type in the last row (or paste past it) to add invoices. Customer and Subtotal are
 * required, Subtotal must be above 0: break a rule to see the error states.
 * **Issued** opens a date editor (Alt+↓ for the calendar) and **Category** a searchable
 * list: both are popover editors. Select cells in a few rows and press **Delete N rows**:
 * they're struck through until Save (Ctrl+Z or **Restore** brings them back).
 * **Edit row** opens the active row as a form in a side drawer.
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
            allowAdd: true,
            allowDelete: true,
            recordDrawer: true,
            newRow: (): Partial<Invoice> => ({
              status: 'Draft',
              terms: 'Net 30',
            }),
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

const customerNames = [...new Set(tenThousand.map((r) => r.customer))].sort();
const customerColumns = invoiceColumns.map((c) =>
  'accessorKey' in c && c.accessorKey === 'customer'
    ? {
        ...c,
        meta: {
          ...c.meta,
          editor: 'combobox' as const,
          // A fake server: 400 ms per search, cancelled when the user types on.
          searchOptions: (query: string, signal: AbortSignal) =>
            new Promise<readonly string[]>((resolve, reject) => {
              const t = setTimeout(
                () =>
                  resolve(
                    customerNames.filter((n) =>
                      n.toLowerCase().includes(query.toLowerCase()),
                    ),
                  ),
                400,
              );
              signal.addEventListener('abort', () => {
                clearTimeout(t);
                reject(signal.reason);
              });
            }),
        },
      }
    : c,
);

/**
 * Customer as a **server-search combobox** (`meta.searchOptions`): type in the cell and
 * the grid asks your function for matches, 250 ms after the last key. A slower
 * search is cancelled through its `AbortSignal`, so stale results never win.
 */
export const ServerSearchEditor: Story = {
  render: () => {
    function Example() {
      const [rows, setRows] = useState(() => tenThousand.slice(0, 200));
      return (
        <DataGrid
          aria-label="Invoices"
          title="Invoices"
          data={rows}
          columns={customerColumns}
          getRowId={getRowId}
          density="standard"
          className="h-[36rem]"
          editing={{
            isRowLocked: isPaid,
            onSave: async (changes) => {
              console.info('onSave', changes);
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

type ServerReply = 'ok' | 'validation' | 'conflict' | 'network error';

/**
 * Choose what the fake server answers, then edit a row or two and **Save all**:
 * - **validation**: the first changed row is rejected with a message on its Customer cell.
 * - **conflict**: the first changed row "was changed by Dana"; pick Use theirs or Keep mine.
 * - **network error**: the save throws; your changes stay.
 */
export const SaveResults: StoryObj<{ reply: ServerReply }> = {
  args: { reply: 'conflict' },
  argTypes: {
    reply: {
      control: 'radio',
      options: ['ok', 'validation', 'conflict', 'network error'],
    },
  },
  render: ({ reply }) => {
    function Example() {
      const [rows, setRows] = useState(() => tenThousand.slice(0, 50));
      return (
        <DataGrid
          aria-label="Invoices"
          title={`Server replies: ${reply}`}
          data={rows}
          columns={invoiceColumns}
          getRowId={getRowId}
          className="h-[30rem]"
          editing={{
            isRowLocked: isPaid,
            getRowVersion: () => 1,
            onSave: async (changes): Promise<SaveResult> => {
              console.info('onSave', changes);
              await new Promise((r) => setTimeout(r, 500));
              const first = changes.operations[0];
              const id = first?.op === 'update' ? first.id : undefined;
              if (reply === 'network error') throw new Error('503');
              if (reply === 'validation' && id)
                return {
                  ok: false,
                  kind: 'validation',
                  rows: {
                    [id]: {
                      fields: { customer: ['Customer is on credit hold'] },
                    },
                  },
                };
              if (reply === 'conflict' && id)
                return {
                  ok: false,
                  kind: 'conflict',
                  rows: [
                    {
                      id,
                      version: 2,
                      current: { customer: 'Changed by Dana' },
                      by: 'Dana',
                      at: new Date().toISOString(),
                    },
                  ],
                };
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
