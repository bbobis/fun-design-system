import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { ProgressBar, ProgressCircle, Spinner } from './progress';

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

/**
 * `tone`: the outcome in color, *and* in words (`valueLabel`), since color alone
 * doesn't reach everyone.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <ProgressBar label="Importing invoices" value={45} />
      <ProgressBar
        label="Sync"
        value={60}
        tone="info"
        valueLabel="60%, syncing"
      />
      <ProgressBar
        label="Import"
        value={100}
        tone="success"
        valueLabel="Done, 300 rows"
      />
      <ProgressBar
        label="Storage"
        value={92}
        tone="warning"
        valueLabel="92% full"
      />
      <ProgressBar
        label="Upload"
        value={70}
        tone="danger"
        valueLabel="Failed at 70%"
      />
    </div>
  ),
};

/** `size`: 4px, 8px (default) and 12px. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <ProgressBar
          key={size}
          label={`size="${size}"`}
          value={60}
          size={size}
        />
      ))}
    </div>
  ),
};

/**
 * `valuePosition="end"`: the value beside the bar, for compact rows. With
 * `hideLabel`, the row's own text says what it is.
 */
export const ValueAtEnd: Story = {
  render: () => (
    <ul className="flex flex-col divide-y divide-border rounded-md border border-border text-sm">
      {[
        { name: 'invoices-2026.csv', value: 100, tone: 'success' as const },
        { name: 'customers.csv', value: 64, tone: 'primary' as const },
        { name: 'payments.xlsx', value: 12, tone: 'primary' as const },
      ].map((f) => (
        <li key={f.name} className="flex flex-col gap-1 px-3 py-2">
          <span>{f.name}</span>
          <ProgressBar
            label={`Uploading ${f.name}`}
            value={f.value}
            tone={f.tone}
            size="sm"
            hideLabel
            valuePosition="end"
          />
        </li>
      ))}
    </ul>
  ),
};

/**
 * ProgressCircle: the ring version for tight spots. Same `progressbar` role as the
 * bar. No `value` = a spinning arc. `showValue` puts the percentage in the middle.
 */
export const Circle: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-6">
        <ProgressCircle label="Syncing (small)" value={30} size="sm" />
        <ProgressCircle label="Syncing" value={45} showValue />
        <ProgressCircle
          label="Syncing (large)"
          value={72}
          size="lg"
          showValue
        />
        <ProgressCircle label="Loading" size="md" />
      </div>
      <div className="flex items-center gap-6">
        <ProgressCircle label="Done" value={100} tone="success" showValue />
        <ProgressCircle label="Storage" value={92} tone="warning" showValue />
        <ProgressCircle label="Failed" value={70} tone="danger" showValue />
        <span className="flex items-center gap-2 text-sm">
          <ProgressCircle label="Uploading invoices.csv" value={55} size="sm" />
          invoices.csv
        </span>
      </div>
    </div>
  ),
};
