import type { Meta, StoryObj } from '@storybook/react-vite';
import { TankGauge } from './tank-gauge';

const meta = {
  title: 'Pipeline Map/TankGauge',
  component: TankGauge,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    tanks: [
      { id: 'T-1', label: 'T-1', volume: 41_000, capacity: 50_000 },
      { id: 'T-2', label: 'T-2', volume: 22_500, capacity: 50_000 },
      { id: 'T-3', label: 'T-3', volume: 48_000, capacity: 50_000 },
    ],
    highLevel: 0.9,
  },
  render: (args) => (
    <svg width={140} height={40} className="block">
      <TankGauge {...args} transform="translate(4 6)" />
    </svg>
  ),
} satisfies Meta<typeof TankGauge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One bar per tank. T-3 is above `highLevel`, so it's orange and named in the label. */
export const Playground: Story = {};

/** Empty, half, high and full (over capacity clamps to full). */
export const Levels: Story = {
  args: {
    tanks: [0, 0.5, 0.92, 1.2].map((f, i) => ({
      id: `T-${i + 1}`,
      label: `T-${i + 1}`,
      volume: f * 1000,
      capacity: 1000,
    })),
  },
};
