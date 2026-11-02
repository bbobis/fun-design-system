import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge';
import { Breadcrumbs } from '../breadcrumbs';
import { Button } from '../button';
import { PageHeader } from './page-header';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { title: 'Invoices' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Everything: breadcrumbs, title, description, actions. */
export const Full: Story = {
  args: {
    breadcrumbs: (
      <Breadcrumbs
        items={[{ label: 'Billing', href: '#' }, { label: 'Invoices' }]}
      />
    ),
    description: 'All invoices sent in the last 12 months.',
    actions: (
      <>
        <Button intent="secondary">Export</Button>
        <Button>New invoice</Button>
      </>
    ),
  },
};

/** Only the title is required. */
export const TitleOnly: Story = {};

/**
 * A detail page: `back` link, a `meta` row (status, dates), actions, and `nav`:
 * section links styled like tabs. They're links in a `<nav>`, not a Tabs widget,
 * because each section is its own URL. `divided` puts a line under them.
 */
export const DetailPage: Story = {
  args: {
    title: 'INV-1042',
    back: { href: '#invoices', label: 'Invoices' },
    meta: (
      <>
        <Badge tone="warning">Due in 3 days</Badge>
        <span>Northwind Traders</span>
        <span>
          Issued <time dateTime="2026-10-02">Oct 2, 2026</time>
        </span>
        <span className="tabular-nums">$1,280.00</span>
      </>
    ),
    actions: (
      <>
        <Button intent="secondary">Download PDF</Button>
        <Button>Send reminder</Button>
      </>
    ),
    nav: [
      { label: 'Overview', href: '#overview', current: true },
      { label: 'Line items', href: '#lines', count: 6 },
      { label: 'Activity', href: '#activity', count: 12 },
      { label: 'Settings', href: '#settings' },
    ],
    divided: true,
  },
};

/** `size`: `sm` for dense admin screens, `md` (default), `lg` for a landing page. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <PageHeader
          key={size}
          size={size}
          divided
          title={`size="${size}"`}
          description="All invoices sent in the last 12 months."
          actions={
            <Button size={size === 'sm' ? 'sm' : 'md'}>New invoice</Button>
          }
        />
      ))}
    </div>
  ),
};
