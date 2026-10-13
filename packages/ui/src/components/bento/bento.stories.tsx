import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardHeader, CardLink } from '../card';
import { Drawer } from '../drawer';
import { Text } from '../text';
import { Bento, BentoTile } from './bento';

const meta = {
  title: 'Layout/Bento',
  component: Bento,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Bento>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A tile's content: a Card that fills the tile. */
function Tile({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card as="section" className="flex h-full flex-col gap-2">
      <Text size="sm" tone="muted">
        {title}
      </Text>
      {children}
    </Card>
  );
}
const Big = ({ children }: { children: ReactNode }) => (
  <span className="text-2xl font-semibold tabular-nums">{children}</span>
);

function Dashboard() {
  return (
    <Bento columns={{ base: 1, md: 2, lg: 4 }}>
      <BentoTile span={2} rows={2}>
        <Tile title="Revenue this month">
          <Big>$84,210</Big>
          <Text size="sm" tone="muted">
            Up 12% on September. 41 invoices paid.
          </Text>
          <div
            className="mt-auto h-24 rounded-md bg-surface"
            aria-hidden="true"
          />
        </Tile>
      </BentoTile>
      <BentoTile>
        <Tile title="Open invoices">
          <Big>23</Big>
        </Tile>
      </BentoTile>
      <BentoTile>
        <Tile title="Overdue">
          <Big>4</Big>
          <Badge tone="danger" className="self-start">
            $6,120
          </Badge>
        </Tile>
      </BentoTile>
      <BentoTile span={{ md: 2 }}>
        <Tile title="Recent activity">
          <Text size="sm">INV-1044 paid · Cobalt Health · 2 min ago</Text>
          <Text size="sm">INV-1043 sent · Acme Corp · 1 h ago</Text>
        </Tile>
      </BentoTile>
      <BentoTile span={{ md: 2, lg: 1 }}>
        <Tile title="Customers">
          <Big>128</Big>
        </Tile>
      </BentoTile>
      <BentoTile span={{ lg: 3 }}>
        <Tile title="Cash flow forecast">
          <div className="h-16 rounded-md bg-surface" aria-hidden="true" />
        </Tile>
      </BentoTile>
    </Bento>
  );
}

/**
 * A dashboard. `columns={{ base: 1, md: 2, lg: 4 }}`: Revenue spans 2 columns and 2
 * rows; on a narrow container everything stacks in source order.
 */
export const DashboardLayout: Story = { render: () => <Dashboard /> };

/**
 * **Drag the corner** to resize the box: the Bento responds to *its own* width
 * (container queries), not the window's.
 */
export const Resizable: Story = {
  render: () => (
    <div className="w-[56rem] max-w-full resize-x overflow-auto rounded-md border border-dashed border-border-strong p-3">
      <Dashboard />
    </div>
  ),
};

/**
 * The same Bento in a 42rem Drawer, even on a wide screen: it has ~39rem of room (below
 * `sm`, 40rem), so it shows **one column**. Screen-width breakpoints (`lg:`) would see
 * the wide window and squeeze in 4 columns of ~144px.
 */
export const InDrawer: Story = {
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open overview</Button>
        <Drawer open={open} onOpenChange={setOpen} size="lg" title="Overview">
          <Dashboard />
        </Drawer>
      </>
    );
  },
};

/**
 * `as="ul"` + `as="li"` when the tiles are a list of like things: screen readers say
 * "list, 4 items". Tiles here are clickable Cards (CardLink).
 */
export const CardList: Story = {
  render: () => (
    <Bento
      as="ul"
      columns={{ base: 1, sm: 2, lg: 4 }}
      rowHeight="sm"
      aria-label="Customers"
    >
      {['Northwind Traders', 'Acme Corp', 'Cobalt Health', 'Delta Foods'].map(
        (name, i) => (
          <BentoTile key={name} as="li" span={i === 0 ? { lg: 2 } : 1}>
            <Card as="article" className="h-full">
              <CardHeader
                title={<CardLink href={`#customer-${i}`}>{name}</CardLink>}
                description={`${3 + i} open invoices`}
              />
            </Card>
          </BentoTile>
        ),
      )}
    </Bento>
  ),
};

/**
 * A tile asks for more columns than there are: `span={4}` in a 2-column grid. It's
 * capped at 2, so the grid never grows an extra column off the side.
 */
export const SpanCapped: Story = {
  render: () => (
    <Bento columns={2} rowHeight="sm">
      <BentoTile span={4}>
        <Tile title="span={4}, capped to 2" />
      </BentoTile>
      <BentoTile>
        <Tile title="1" />
      </BentoTile>
      <BentoTile>
        <Tile title="2" />
      </BentoTile>
    </Bento>
  ),
};
