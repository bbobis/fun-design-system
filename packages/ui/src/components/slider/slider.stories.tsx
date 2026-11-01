import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { NumberField } from '../number-field';
import { Slider } from './slider';

const meta = {
  title: 'Components/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: { label: 'Volume', defaultValue: 40 },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One value. Try the controls on the right. */
export const Playground: Story = {
  args: { description: 'Applies to notification sounds.' },
};

/**
 * A `[start, end]` value gives two thumbs. They can't cross: drag the left one into
 * the right one and it stops there.
 */
export const Range: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState<[number, number]>([120, 380]);
      return (
        <div className="flex flex-col gap-3">
          <Slider
            label="Price per night"
            description="Before taxes."
            value={value}
            onChange={setValue}
            min={0}
            max={500}
            step={10}
            formatOptions={{
              style: 'currency',
              currency: 'CAD',
              maximumFractionDigits: 0,
            }}
          />
          <p className="text-sm text-fg-muted">
            App value: <code>{JSON.stringify(value)}</code>
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

/**
 * `onChange` fires on every step of a drag (update the screen); `onChangeEnd` fires once
 * when you let go (fetch results, save). Drag and watch the two counters.
 */
export const ChangeVsChangeEnd: Story = {
  render: () => {
    function Example() {
      const [live, setLive] = useState(50);
      const [changes, setChanges] = useState(0);
      const [ends, setEnds] = useState(0);
      return (
        <div className="flex flex-col gap-3">
          <Slider
            label="Brightness"
            value={live}
            onChange={(v) => {
              setLive(v);
              setChanges((n) => n + 1);
            }}
            onChangeEnd={() => setEnds((n) => n + 1)}
            formatOptions={{ style: 'percent' }}
            min={0}
            max={1}
            step={0.01}
          />
          <p className="text-sm text-fg-muted" role="status">
            onChange: {changes} · onChangeEnd: {ends}
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

/**
 * Slider + NumberField on one value: drag for "about here", type for an exact number.
 * Both read and write the same state, so they always agree.
 */
export const WithNumberField: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState(30);
      return (
        <div className="flex items-end gap-3">
          <Slider
            label="Discount"
            value={value}
            onChange={setValue}
            hideValue
            formatOptions={{ style: 'unit', unit: 'percent' }}
            className="flex-1"
          />
          <div className="w-24">
            <NumberField
              aria-label="Discount, exact"
              value={value}
              onChange={(v) => setValue(v ?? 0)}
              min={0}
              max={100}
              hideStepper
              formatOptions={{ style: 'unit', unit: 'percent' }}
            />
          </div>
        </div>
      );
    }
    return <Example />;
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Slider label="Small" size="sm" defaultValue={30} />
      <Slider label="Medium (default)" size="md" defaultValue={60} />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Slider label="Default" defaultValue={40} />
      <Slider label="Disabled" defaultValue={40} disabled />
      <Slider label="Disabled range" defaultValue={[20, 70]} disabled />
    </div>
  ),
};

/**
 * Keyboard: Tab to a thumb. ←/→ or ↑/↓ = one step, PageUp/PageDown = a tenth of the
 * range, Home/End = the ends. In a range, Tab moves from the start thumb to the end
 * thumb.
 */
export const Keyboard: Story = {
  render: () => (
    <Slider
      label="Office hours"
      defaultValue={[9, 17]}
      min={0}
      max={24}
      thumbLabels={['Opens', 'Closes']}
      formatOptions={{ style: 'unit', unit: 'hour' }}
    />
  ),
};
