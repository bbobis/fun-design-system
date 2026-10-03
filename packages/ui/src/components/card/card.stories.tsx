import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from '../heading';
import { Text } from '../text';
import { Card } from './card';

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
