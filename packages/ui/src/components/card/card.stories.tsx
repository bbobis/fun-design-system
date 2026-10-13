import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../badge';
import { Button } from '../button';
import { Heading } from '../heading';
import { Text } from '../text';
import { Menu, MenuItem } from '../menu';
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
} from './card';

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  args: { variant: 'outline', padding: 'md' },
  argTypes: {
    variant: { control: 'radio', options: ['outline', 'filled'] },
    padding: { control: 'radio', options: ['none', 'sm', 'md', 'lg'] },
  },
  render: (args) => (
    <Card {...args} className="w-72">
      <Heading level={3}>Northwind Traders</Heading>
      <Text tone="muted" size="sm">
        Customer since 2019 · Net 30
      </Text>
    </Card>
  ),
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      {(['outline', 'filled'] as const).map((variant) => (
        <Card key={variant} variant={variant} className="w-56">
          <Heading level={3} size="sm">
            {variant}
          </Heading>
          <Text tone="muted" size="sm">
            Card body text.
          </Text>
        </Card>
      ))}
    </div>
  ),
};

const invoices = [
  {
    id: '1042',
    customer: 'Northwind Traders',
    amount: '$1,200.00',
    status: 'Paid',
    tone: 'success',
  },
  {
    id: '1043',
    customer: 'Acme Corp',
    amount: '$860.50',
    status: 'Sent',
    tone: 'info',
  },
  {
    id: '1044',
    customer: 'Cobalt Health',
    amount: '$3,410.00',
    status: 'Overdue',
    tone: 'danger',
  },
] as const;

/**
 * Clickable cards: put a `CardLink` around the title. Click anywhere on a card (or Tab to
 * it and press Enter) to follow the link. Screen readers hear just "INV-1042, link".
 */
export const Clickable: Story = {
  render: () => (
    <ul className="grid max-w-3xl gap-4 sm:grid-cols-3">
      {invoices.map((inv) => (
        <li key={inv.id}>
          <Card as="article" className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Heading level={3} size="sm">
                <CardLink href={`#invoice-${inv.id}`}>INV-{inv.id}</CardLink>
              </Heading>
              <Badge tone={inv.tone}>{inv.status}</Badge>
            </div>
            <Text tone="muted" size="sm">
              {inv.customer}
            </Text>
            <Text size="sm" className="font-medium tabular-nums">
              {inv.amount}
            </Text>
          </Card>
        </li>
      ))}
    </ul>
  ),
};

/**
 * A button inside a clickable card still does its own thing: "Download PDF" doesn't
 * open the invoice. Tab order: the card link, then the button.
 */
export const WithActions: Story = {
  render: function Render() {
    const [log, setLog] = useState('Nothing yet');
    return (
      <div className="flex max-w-xs flex-col gap-3">
        <Card as="article" className="flex flex-col gap-3">
          <Heading level={3} size="sm">
            <CardLink
              href="#invoice-1042"
              onPress={() => setLog('Opened INV-1042')}
            >
              INV-1042
            </CardLink>
          </Heading>
          <Text tone="muted" size="sm">
            Northwind Traders · $1,200.00
          </Text>
          <Button
            size="sm"
            intent="secondary"
            className="self-start"
            onClick={() => setLog('Downloaded INV-1042.pdf')}
          >
            Download PDF
          </Button>
        </Card>
        <p role="status" className="text-sm text-fg-muted">
          Last action: {log}
        </p>
      </div>
    );
  },
};

/** A stand-in illustration (the stories don't load outside images). */
const Illustration = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 320 120"
    className="block h-28 w-full bg-surface"
  >
    <circle cx="70" cy="60" r="34" className="fill-primary" />
    <rect
      x="130"
      y="34"
      width="150"
      height="14"
      rx="7"
      className="fill-border-strong"
    />
    <rect
      x="130"
      y="62"
      width="110"
      height="10"
      rx="5"
      className="fill-border"
    />
    <rect
      x="130"
      y="82"
      width="80"
      height="10"
      rx="5"
      className="fill-border"
    />
  </svg>
);

/**
 * The parts: `CardMedia` (edge to edge, first), `CardHeader` (title, description,
 * actions), `CardBody`, `CardFooter` (divider, actions on the right).
 */
export const Parts: Story = {
  render: () => (
    <Card as="article" className="w-80">
      <CardMedia>
        <Illustration />
      </CardMedia>
      <CardHeader
        title="Northwind Traders"
        description="Customer since 2019"
        actions={<Badge tone="success">Active</Badge>}
      />
      <CardBody>
        12 invoices this year, $18,400 paid. Usually pays within 21 days.
      </CardBody>
      <CardFooter>
        <Button size="sm" intent="ghost">
          View invoices
        </Button>
        <Button size="sm">New invoice</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * `CardMedia` follows the Card's padding, whatever it is. A `section` named by its
 * title (`titleId` + `aria-labelledby`) shows up as a landmark region.
 */
export const PartsPadding: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {(['sm', 'md', 'lg'] as const).map((padding) => (
        <Card
          key={padding}
          as="section"
          aria-labelledby={`title-${padding}`}
          padding={padding}
          className="w-56"
        >
          <CardMedia>
            <Illustration />
          </CardMedia>
          <CardHeader
            title={{ sm: 'Small', md: 'Medium', lg: 'Large' }[padding]}
            description={`padding="${padding}"`}
            titleId={`title-${padding}`}
            actions={
              <Menu label="More" intent="ghost" size="sm">
                <MenuItem>Rename</MenuItem>
                <MenuItem>Delete</MenuItem>
              </Menu>
            }
          />
          <CardBody>The image still reaches the edges.</CardBody>
        </Card>
      ))}
    </div>
  ),
};

/** The parts work with `CardLink` too: put it in the header's `title`. */
export const PartsClickable: Story = {
  render: () => (
    <Card as="article" className="w-80">
      <CardMedia>
        <Illustration />
      </CardMedia>
      <CardHeader
        title={
          <CardLink href="#customer-northwind">Northwind Traders</CardLink>
        }
        description="Customer since 2019"
      />
      <CardFooter>
        <Button size="sm" intent="secondary">
          New invoice
        </Button>
      </CardFooter>
    </Card>
  ),
};
