import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bento, BentoTile } from '../bento';
import { Stat, StatGroup } from './stat';

const usd: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

const meta = {
  title: 'Components/Stat',
  component: Stat,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    label: 'Revenue this month',
    value: 84210,
    previous: 75180,
    period: 'vs September',
    format: usd,
    size: 'md',
    goodWhen: 'up',
    loading: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    goodWhen: { control: 'radio', options: ['up', 'down'] },
  },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One Stat alone is narrow, like a dashboard tile. (Wide stories set their own.) */
const narrow: Story['decorators'] = [
  (Story) => (
    <div className="max-w-xs">
      <Story />
    </div>
  ),
];

/** Screen readers hear "Revenue this month, $84,210, Up 12.0% vs September". */
export const Playground: Story = { decorators: narrow };

/**
 * A dashboard row: each Stat in a Bento tile with `surface="card"`. Overdue uses
 * `goodWhen="down"`, so its rise is red. Customers didn't change: grey, "No change".
 */
export const DashboardRow: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-5xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Bento columns={{ base: 1, sm: 2, lg: 4 }}>
      <BentoTile surface="card">
        <Stat
          label="Revenue this month"
          value={84210}
          previous={75180}
          period="vs Sep"
          format={usd}
          sparkline={[61, 64, 70, 68, 75, 84]}
        />
      </BentoTile>
      <BentoTile surface="card">
        <Stat
          label="Overdue invoices"
          value={7}
          previous={4}
          period="vs Sep"
          goodWhen="down"
          sparkline={[3, 5, 4, 4, 4, 7]}
        />
      </BentoTile>
      <BentoTile surface="card">
        <Stat
          label="Average days to pay"
          value={18}
          previous={22}
          period="vs Sep"
          goodWhen="down"
          hint="Target: 21 days"
        />
      </BentoTile>
      <BentoTile surface="card">
        <Stat label="Customers" value={128} previous={128} period="vs Sep" />
      </BentoTile>
    </Bento>
  ),
};

/**
 * `StatGroup`: one `<dl>` for a row of numbers that belong together, without cards.
 * Lay it out with classes.
 */
export const Group: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <StatGroup
      aria-label="October totals"
      className="grid-cols-3 divide-x divide-border rounded-md border border-border *:px-4 *:py-3"
    >
      <Stat
        size="sm"
        label="Invoiced"
        value={124300}
        previous={118900}
        format={usd}
        locale="en-US"
      />
      <Stat
        size="sm"
        label="Collected"
        value={0.912}
        previous={0.874}
        format={{ style: 'percent', maximumFractionDigits: 1 }}
      />
      <Stat
        size="sm"
        label="Rows imported"
        value={1240000}
        format={{ notation: 'compact' }}
        hint="All time"
      />
    </StatGroup>
  ),
};

/** `size`: sm for dense rows, lg for the one number a page is about. */
export const Sizes: Story = {
  decorators: narrow,
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Stat key={size} {...args} size={size} />
      ))}
    </div>
  ),
};

/** `loading`: a placeholder the size of the number, and `aria-busy` on it. */
export const Loading: Story = {
  decorators: narrow,
  args: { loading: true },
};

/**
 * The prediction: last month was $0. A % change from 0 is infinite, so no change is
 * shown. Say it in `hint` instead.
 */
export const FromZero: Story = {
  decorators: narrow,
  args: {
    label: 'Revenue, first month',
    value: 500,
    previous: 0,
    hint: 'New this month',
  },
};
