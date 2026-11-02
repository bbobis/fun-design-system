import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../badge';
import { Button } from '../button';
import { Drawer } from '../drawer';
import { Link } from '../link';
import { DescriptionItem, DescriptionList } from './description-list';

const meta = {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { layout: 'horizontal', divided: true, size: 'md' },
  argTypes: {
    layout: { control: 'radio', options: ['horizontal', 'vertical', 'grid'] },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

function InvoiceItems() {
  return (
    <>
      <DescriptionItem label="Invoice number" copy="INV-1044">
        <span className="font-mono">INV-1044</span>
      </DescriptionItem>
      <DescriptionItem label="Status">
        <Badge tone="success">Paid</Badge>
      </DescriptionItem>
      <DescriptionItem label="Customer">
        <Link href="#acme">Acme Corp</Link>
      </DescriptionItem>
      <DescriptionItem label="Billing email" copy="billing@acme.example">
        billing@acme.example
      </DescriptionItem>
      <DescriptionItem label="Issued">Oct 2, 2026</DescriptionItem>
      <DescriptionItem label="Due">Nov 1, 2026</DescriptionItem>
      <DescriptionItem label="PO number" />
      <DescriptionItem label="Total">
        <span className="font-semibold tabular-nums">$4,200.00</span>
      </DescriptionItem>
    </>
  );
}

/**
 * An invoice's details. Tab reaches the link and the copy buttons ("Copy Invoice
 * number"); after copying, screen readers hear "Copied". The empty PO number shows
 * "—" and is read as "None".
 */
export const InvoiceDetails: Story = {
  render: (args) => (
    <DescriptionList {...args} aria-label="Invoice details">
      <InvoiceItems />
    </DescriptionList>
  ),
};

/**
 * The same list in a small (24rem) Drawer: the box is under 28rem, so labels go above
 * values.
 * A container query: it follows the box, not the window.
 */
export const InDrawer: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open INV-1044</Button>
        <Drawer open={open} onOpenChange={setOpen} size="sm" title="INV-1044">
          <DescriptionList {...args} aria-label="Invoice details">
            <InvoiceItems />
          </DescriptionList>
        </Drawer>
      </>
    );
  },
};

/**
 * `layout="grid"`: stacked items in columns (2 from 24rem, 3 from 48rem of box
 * width). `span="full"` gives the address and notes a whole row.
 */
export const Grid: Story = {
  args: { layout: 'grid', divided: false },
  render: (args) => (
    <DescriptionList {...args} aria-label="Customer">
      <DescriptionItem label="Name">Acme Corp</DescriptionItem>
      <DescriptionItem label="Customer ID" copy="CUS-0042">
        <span className="font-mono">CUS-0042</span>
      </DescriptionItem>
      <DescriptionItem label="Payment terms">Net 30</DescriptionItem>
      <DescriptionItem label="Currency">USD</DescriptionItem>
      <DescriptionItem label="Tax ID" />
      <DescriptionItem label="Open invoices">3</DescriptionItem>
      <DescriptionItem label="Billing address" span="full">
        200 Main Street, Suite 4, Springfield, OR 97477
      </DescriptionItem>
      <DescriptionItem label="Notes" span="full">
        Prefers invoices split by project. Contact billing@acme.example before
        changing terms.
      </DescriptionItem>
    </DescriptionList>
  ),
};

/** `layout="vertical"`: label above value, one per row. */
export const Vertical: Story = {
  args: { layout: 'vertical', divided: false },
  render: InvoiceDetails.render,
};

/** `size="sm"`: tighter rows and a smaller label, for side panels. */
export const Small: Story = {
  args: { size: 'sm' },
  render: InvoiceDetails.render,
};
