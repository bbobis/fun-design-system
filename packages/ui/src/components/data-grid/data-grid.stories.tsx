import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import { DataGrid } from './data-grid';
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

/** 10,000 rows × 20 columns. Only the rows in view are rendered; scroll, sort and search. */
export const TenThousandRows: Story = {
  args: {
    enableRowSelection: true,
    className: 'h-[36rem]',
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
