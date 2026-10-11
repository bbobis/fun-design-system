import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { ProgressBar, Spinner } from './progress';

const meta = {
  title: 'Components/Progress',
  component: ProgressBar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Uploading invoices.csv', value: 45 },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A bar that fills over a few seconds, then starts again. */
export const Filling: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState(0);
      useEffect(() => {
        const t = setInterval(
          () => setValue((v) => (v >= 100 ? 0 : v + 5)),
          300,
        );
        return () => clearInterval(t);
      }, []);
      return <ProgressBar label="Uploading invoices.csv" value={value} />;
    }
    return <Example />;
  },
};

/** Counts instead of a percentage, via `valueLabel`. */
export const WithCounts: Story = {
  args: {
    label: 'Importing',
    value: 120,
    max: 300,
    valueLabel: '120 of 300 rows',
  },
};

/** No `value`: the end isn't known yet. With reduced motion it's a still bar. */
export const Indeterminate: Story = {
  args: { label: 'Preparing export', value: undefined },
};

/** Spinner sizes. Each one is named for screen readers by its `label`. */
export const Spinners: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="sm" label="Loading rows" />
      <Spinner size="md" />
      <Spinner size="lg" label="Loading report" />
    </div>
  ),
};
