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
    size: { control: 'radio', options: ['xs', 'sm', 'md', 'lg'] },
    tone: {
      control: 'radio',
      options: ['default', 'muted', 'danger', 'inherit'],
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
