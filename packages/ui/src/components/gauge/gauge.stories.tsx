import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../card';
import { Heading } from '../heading';
import { Gauge } from './gauge';

const meta = {
  title: 'Patterns/Gauge',
  component: Gauge,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    label: 'Discharge pressure',
    value: 3200,
    min: 0,
    max: 8000,
    unit: 'kPa',
    thresholds: { lowLow: 500, low: 1500, high: 6000, highHigh: 7200 },
    setpoint: 4000,
    size: 'md',
    orientation: 'horizontal',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 8500, step: 50 } },
    size: { control: 'radio', options: ['sm', 'md'] },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drag `value`: gray while normal, amber ▲ in H / L, red ⚠ in HH / LL. */
export const Playground: Story = {};

/**
 * A pump station panel. Normal readings stay gray, so the one that's high is what
 * you see first (ISA-101). ▾ under the track is the setpoint.
 */
export const PumpStation: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Card className="flex flex-col gap-5">
      <Heading level={2} size="md">
        Station B · Pump 2
      </Heading>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Gauge
          label="Suction pressure"
          value={820}
          max={2000}
          unit="kPa"
          thresholds={{ lowLow: 200, low: 400 }}
          setpoint={800}
        />
        <Gauge
          label="Discharge pressure"
          value={6420}
          max={8000}
          unit="kPa"
          thresholds={{ high: 6000, highHigh: 7200 }}
          setpoint={5500}
        />
        <Gauge
          label="Flow"
          value={1180}
          max={1500}
          unit="m³/h"
          thresholds={{ low: 300, high: 1400 }}
        />
        <Gauge
          label="Motor temperature"
          value={104}
          max={140}
          unit="°C"
          thresholds={{ high: 95, highHigh: 105 }}
        />
      </div>
    </Card>
  ),
};

/** `orientation="vertical"`: tank levels. Tank 2 is low-low (red ⚠). */
export const TankFarm: Story = {
  render: () => (
    <div className="flex gap-10">
      {[
        ['Tank 1', 64],
        ['Tank 2', 4],
        ['Tank 3', 92],
        ['Tank 4', 38],
      ].map(([name, level]) => (
        <Gauge
          key={name}
          orientation="vertical"
          label={`${name} level`}
          value={level as number}
          unit="%"
          thresholds={{ lowLow: 5, low: 10, high: 90, highHigh: 95 }}
        />
      ))}
    </div>
  ),
};

/**
 * `stale`: the reading is old (lost comms). Gray, no band color, and the reason
 * shown and read: an old "normal" mustn't look like a live one.
 */
export const Stale: Story = {
  args: { value: 6420, stale: 'No data since 10:42' },
};

/** `size="sm"`: for dense panels and table cells. */
export const Small: Story = {
  args: { size: 'sm', value: 6420 },
};
