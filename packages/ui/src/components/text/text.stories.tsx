import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './text';

const meta = {
  title: 'Components/Text',
  component: Text,
  tags: ['autodocs'],
  args: {
    children: 'Invoices are due 30 days after issue.',
    size: 'md',
    tone: 'default',
    weight: 'regular',
  },
  argTypes: {
    size: { control: 'radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    tone: {
      control: 'radio',
      options: [
        'default',
        'muted',
        'danger',
        'success',
        'warning',
        'info',
        'inherit',
      ],
    },
    weight: { control: 'radio', options: ['regular', 'medium', 'semibold'] },
  },
} satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `numeric` lines digits up in columns. Compare the two lists. */
export const Numeric: Story = {
  render: () => (
    <div className="flex gap-10">
      <div className="text-right">
        <Text size="sm" tone="muted">
          default
        </Text>
        <Text>$1,111.11</Text>
        <Text>$8,888.88</Text>
      </div>
      <div className="text-right">
        <Text size="sm" tone="muted">
          numeric
        </Text>
        <Text numeric>$1,111.11</Text>
        <Text numeric>$8,888.88</Text>
      </div>
    </div>
  ),
};

/** Status tones. Each line says its status in words: the color is extra. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Text tone="success">Paid: $1,280.00 received on Oct 29.</Text>
      <Text tone="warning">Due soon: payment expected in 3 days.</Text>
      <Text tone="danger">Overdue: 12 days past the due date.</Text>
      <Text tone="info">Note: reminders go out at 6:00 AM.</Text>
      <Text tone="muted">Draft: not sent yet.</Text>
    </div>
  ),
};

const long =
  'Northwind Traders asked about the GST line on the October invoice, which appears twice because the tax rule changed halfway through the billing period and both rates were applied to the same lines.';

/**
 * `truncate`: one line with "…", or a number of lines. Only the look is cut: screen
 * readers and copy-paste get the full text.
 */
export const Truncation: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <Text size="sm" truncate>
        {long}
      </Text>
      <Text size="sm" truncate={2}>
        {long}
      </Text>
      <Text size="sm" truncate={3} tone="muted">
        {long}
      </Text>
    </div>
  ),
};
