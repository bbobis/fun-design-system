import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../field';
import { NumberField } from './number-field';

const meta = {
  title: 'Components/NumberField',
  component: NumberField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type "1234.5" and tab away: it shows $1,234.50; the app gets 1234.5. */
export const Currency: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState<number | null>(1250);
      return (
        <div className="flex flex-col gap-2">
          <Field label="Subtotal" description="Before tax, in CAD.">
            <NumberField
              value={value}
              onChange={setValue}
              min={0}
              step={0.01}
              formatOptions={{ style: 'currency', currency: 'CAD' }}
            />
          </Field>
          <p className="text-sm text-fg-muted">
            App value: <code>{JSON.stringify(value)}</code>
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

/** `style: 'percent'`: the app stores 0.15, the field shows 15%. */
export const Percent: Story = {
  render: () => (
    <Field label="Margin">
      <NumberField
        defaultValue={0.15}
        step={0.01}
        min={0}
        max={1}
        formatOptions={{ style: 'percent' }}
      />
    </Field>
  ),
};

/** Whole numbers with a range; ↑/↓ step by 1 and stop at the limits. */
export const Quantity: Story = {
  render: () => (
    <Field label="Items" description="1 to 99.">
      <NumberField
        defaultValue={1}
        min={1}
        max={99}
        formatOptions={{ maximumFractionDigits: 0 }}
      />
    </Field>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Field label="Invalid" error="Must be more than 0">
        <NumberField defaultValue={0} />
      </Field>
      <Field label="Disabled" disabled>
        <NumberField defaultValue={42} />
      </Field>
      <Field label="No stepper">
        <NumberField defaultValue={7} hideStepper />
      </Field>
    </div>
  ),
};
