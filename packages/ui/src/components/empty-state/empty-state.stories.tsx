import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SVGProps } from 'react';
import { Button } from '../button';
import { DataGrid } from '../data-grid';
import { invoiceColumns } from '../data-grid/fixtures/invoice-columns';
import type { Invoice } from '../data-grid/fixtures/invoices';
import { EmptyState } from './empty-state';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    title: 'No invoices yet',
    headingLevel: 2,
    description: 'Invoices you create or import show up here.',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** No data yet: the action creates the first thing. */
export const NoDataYet: Story = {
  args: {
    icon: <InboxIcon />,
    action: <Button>Create invoice</Button>,
  },
};

/** No results: different words and a different action (undo the search, not create). */
export const NoResults: Story = {
  args: {
    title: 'No invoices match “acme”',
    description: 'Check the spelling, or try fewer filters.',
    icon: <SearchIcon />,
    action: <Button intent="secondary">Clear search and filters</Button>,
  },
};

/** `size="compact"` inside a DataGrid, through its `emptyMessage` prop. */
export const InsideADataGrid: Story = {
  render: () => (
    <DataGrid<Invoice>
      aria-label="Invoices"
      title="Invoices"
      data={[]}
      columns={invoiceColumns}
      getRowId={(r) => r.id}
      className="h-72"
      emptyMessage={
        <EmptyState
          size="compact"
          headingLevel={3}
          title="No overdue invoices"
          description="Everything is paid or not due yet."
        />
      }
    />
  ),
};

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}
function InboxIcon() {
  return (
    <Svg>
      <path d="M3 13h5l1.5 2.5h5L16 13h5M5 5h14l2 8v6H3v-6z" />
    </Svg>
  );
}
function SearchIcon() {
  return (
    <Svg>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Svg>
  );
}
