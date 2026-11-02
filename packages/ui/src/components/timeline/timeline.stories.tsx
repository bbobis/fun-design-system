import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SVGProps } from 'react';
import { Avatar } from '../avatar';
import { Badge } from '../badge';
import { Link } from '../link';
import { Timeline, TimelineItem } from './timeline';

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { size: 'md', 'aria-label': 'INV-1044 history' },
  argTypes: { size: { control: 'radio', options: ['sm', 'md'] } },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const Icon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);
const CheckIcon = () => (
  <Icon>
    <path d="m3.5 8.5 3 3 6-7" />
  </Icon>
);
const SendIcon = () => (
  <Icon>
    <path d="M2.5 8 13.5 2.5 10 13.5 7.5 8.5z" />
  </Icon>
);
const EyeIcon = () => (
  <Icon>
    <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
    <circle cx="8" cy="8" r="1.75" />
  </Icon>
);
const BellIcon = () => (
  <Icon>
    <path d="M4.25 11.25V7a3.75 3.75 0 0 1 7.5 0v4.25l1 1H3.25z" />
    <path d="M6.75 13.75a1.25 1.25 0 0 0 2.5 0" />
  </Icon>
);

/**
 * An invoice's history, newest first. Each time is a `<time dateTime>`: the ISO value
 * for machines, formatted for the reader's language on screen. Icons are decoration;
 * the titles say what happened.
 */
export const InvoiceHistory: Story = {
  render: (args) => (
    <Timeline {...args}>
      <TimelineItem
        tone="success"
        marker={<CheckIcon />}
        title="Payment received"
        time="2026-10-14T09:32:00Z"
      >
        $4,200.00 by card ending 4242
      </TimelineItem>
      <TimelineItem
        tone="warning"
        marker={<BellIcon />}
        title="Reminder sent: 3 days overdue"
        time="2026-10-12T08:00:00Z"
      />
      <TimelineItem
        tone="info"
        marker={<EyeIcon />}
        title="Viewed by the customer"
        time="2026-10-03T16:05:00Z"
      />
      <TimelineItem
        marker={<SendIcon />}
        title="Invoice sent to billing@acme.example"
        time="2026-10-02"
      />
    </Timeline>
  ),
};

/**
 * An activity feed: `actor` in bold, an Avatar as the `marker` (`decorative`, since
 * the name is already printed), and details under the title. `timeLabel` shows
 * relative text; the exact time stays in `dateTime`.
 */
export const ActivityFeed: Story = {
  args: { 'aria-label': 'Recent activity' },
  render: (args) => (
    <Timeline {...args}>
      <TimelineItem
        actor="Dana Smith"
        title="commented on INV-1044"
        marker={<Avatar name="Dana Smith" size="xs" decorative />}
        time="2026-11-02T14:20:00Z"
        timeLabel="12 minutes ago"
      >
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-fg">
          Customer asked to split this into two payments.
        </p>
      </TimelineItem>
      <TimelineItem
        actor="Luis Ortega"
        title="changed the status"
        marker={<Avatar name="Luis Ortega" size="xs" decorative />}
        time="2026-11-02T11:02:00Z"
        timeLabel="3 hours ago"
      >
        <span className="flex items-center gap-1.5">
          <Badge tone="neutral">Draft</Badge>→<Badge tone="info">Sent</Badge>
        </span>
      </TimelineItem>
      <TimelineItem
        actor="Priya Nair"
        title="created the invoice"
        marker={<Avatar name="Priya Nair" size="xs" decorative />}
        time="2026-11-01"
        timeLabel="Yesterday"
      >
        <Link href="#inv-1044">INV-1044</Link> for Acme Corp
      </TimelineItem>
    </Timeline>
  ),
};

/**
 * `upcoming`: hollow marker, dashed line, muted text. Screen readers hear "Payment
 * due, upcoming", because the dashed style alone doesn't reach them.
 */
export const Upcoming: Story = {
  args: { 'aria-label': 'Payment plan' },
  render: (args) => (
    <Timeline {...args}>
      <TimelineItem
        tone="success"
        title="Deposit paid: $1,000"
        time="2026-10-01"
      />
      <TimelineItem
        tone="success"
        title="Instalment 1 paid: $1,600"
        time="2026-10-15"
      />
      <TimelineItem upcoming title="Instalment 2: $1,600" time="2026-11-15" />
      <TimelineItem
        upcoming
        title="Final instalment: $1,600"
        time="2026-12-15"
      />
    </Timeline>
  ),
};

/** The default dot in every `tone`. The title must still say what happened. */
export const Tones: Story = {
  render: (args) => (
    <Timeline {...args}>
      <TimelineItem tone="neutral" title="Draft saved" />
      <TimelineItem tone="info" title="Sent to the customer" />
      <TimelineItem tone="success" title="Paid in full" />
      <TimelineItem tone="warning" title="Payment is 3 days late" />
      <TimelineItem tone="danger" title="Card declined" />
    </Timeline>
  ),
};

/** `size="sm"`: for side panels and drawers. */
export const Small: Story = {
  args: { size: 'sm' },
  render: InvoiceHistory.render,
};
