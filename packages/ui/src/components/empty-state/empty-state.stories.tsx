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
function CloudOffIcon() {
  return (
    <Svg>
      <path d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 9.1 4.5 4.5 0 0 0 7 18zM4 4l16 16" />
    </Svg>
  );
}
function CheckIcon() {
  return (
    <Svg>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
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

/**
 * `tone`: the icon circle's color. The title still says what happened; the color is
 * extra.
 */
export const Tones: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <EmptyState
        size="compact"
        variant="card"
        tone="danger"
        headingLevel={3}
        icon={<CloudOffIcon />}
        title="Couldn't load invoices"
        description="The server didn't answer. Your data is safe."
        action={
          <Button size="sm" intent="secondary">
            Try again
          </Button>
        }
      />
      <EmptyState
        size="compact"
        variant="card"
        tone="success"
        headingLevel={3}
        icon={<CheckIcon />}
        title="All caught up"
        description="No overdue invoices."
      />
    </div>
  ),
};

/** `variant`: `plain` (default), `bordered` (dashed box) and `card` (soft panel). */
export const Variants: Story = {
  render: () => (
    <div className="grid gap-4 sm:grid-cols-3">
      {(['plain', 'bordered', 'card'] as const).map((variant) => (
        <EmptyState
          key={variant}
          size="compact"
          variant={variant}
          headingLevel={3}
          icon={<InboxIcon />}
          title={`variant="${variant}"`}
          description="Invoices you create show up here."
          action={<Button size="sm">Create invoice</Button>}
        />
      ))}
    </div>
  ),
};

/** `size="large"` for a whole empty page; `align="start"` for a side panel. */
export const LargeAndStart: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <EmptyState
        size="large"
        variant="bordered"
        headingLevel={2}
        icon={<InboxIcon />}
        title="Welcome! Create your first invoice"
        description="Add a customer, list what you charge for, and send it in a minute."
        action={<Button>Create invoice</Button>}
      />
      <EmptyState
        size="compact"
        align="start"
        headingLevel={3}
        title="No notes"
        description="Notes you add to this customer show up here."
        action={
          <Button size="sm" intent="secondary">
            Add note
          </Button>
        }
      />
    </div>
  ),
};
