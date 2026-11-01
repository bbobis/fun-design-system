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
    variant: { control: 'radio', options: ['outline', 'filled', 'elevated'] },
    orientation: { control: 'radio', options: ['vertical', 'horizontal'] },
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

/**
 * `outline` (default), `filled`, `elevated`. Shown on a grey surface too, where
 * `elevated` is meant to float.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 rounded-lg bg-surface p-6">
      {(['outline', 'filled', 'elevated'] as const).map((variant) => (
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

const Photo = ({ hue }: { hue: 'primary' | 'info' | 'success' }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 120 160"
    // Crop to fill, like object-cover on a photo.
    preserveAspectRatio="xMidYMid slice"
    className="bg-surface"
  >
    <circle
      cx="60"
      cy="70"
      r="38"
      className={
        hue === 'primary'
          ? 'fill-primary'
          : hue === 'info'
            ? 'fill-info'
            : 'fill-success'
      }
    />
    <rect
      x="20"
      y="120"
      width="80"
      height="10"
      rx="5"
      className="fill-border-strong"
    />
  </svg>
);

/**
 * `orientation="horizontal"`: `CardMedia` down the start side, the other parts beside
 * it. The picture fills the card's height but doesn't set it: the text does.
 */
export const Horizontal: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Card orientation="horizontal" as="article">
        <CardMedia>
          <Photo hue="primary" />
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
      <Card orientation="horizontal" variant="elevated" padding="sm">
        <CardMedia>
          <Photo hue="info" />
        </CardMedia>
        <CardHeader title="Acme Corp" description="Net 45 · 3 open invoices" />
      </Card>
    </div>
  ),
};

/**
 * Horizontal + `CardLink`: click anywhere (or Tab + Enter). The ring wraps the whole
 * card; elevated cards lift on hover.
 */
export const HorizontalClickable: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      {invoices.map((inv, i) => (
        <Card
          key={inv.id}
          as="article"
          orientation="horizontal"
          variant="elevated"
          padding="sm"
        >
          <CardMedia>
            <Photo
              hue={(['primary', 'info', 'success'] as const)[i] ?? 'primary'}
            />
          </CardMedia>
          <CardHeader
            title={<CardLink href={`#inv-${inv.id}`}>INV-{inv.id}</CardLink>}
            description={`${inv.customer} · ${inv.amount}`}
            actions={<Badge tone={inv.tone}>{inv.status}</Badge>}
          />
        </Card>
      ))}
    </div>
  ),
};
