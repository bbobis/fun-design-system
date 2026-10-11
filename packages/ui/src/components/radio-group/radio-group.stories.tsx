import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Radio, RadioGroup } from './radio-group';

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Payment terms', children: null },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tab once into the group, then ↑↓ to move and choose. Tab again leaves it. */
export const Default: Story = {
  render: () => {
    function Example() {
      const [terms, setTerms] = useState<string | null>('net30');
      return (
        <RadioGroup
          label="Payment terms"
          description="Applies to new invoices only."
          value={terms}
          onChange={setTerms}
        >
          <Radio value="receipt">Due on receipt</Radio>
          <Radio value="net15">Net 15</Radio>
          <Radio value="net30" description="What most customers get">
            Net 30
          </Radio>
          <Radio value="net60" disabled description="Needs finance approval">
            Net 60
          </Radio>
        </RadioGroup>
      );
    }
    return <Example />;
  },
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup
      label="Density"
      orientation="horizontal"
      defaultValue="standard"
    >
      <Radio value="compact">Compact</Radio>
      <Radio value="standard">Standard</Radio>
      <Radio value="relaxed">Relaxed</Radio>
    </RadioGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <RadioGroup label="Payment terms" required error="Choose payment terms.">
      <Radio value="net15">Net 15</Radio>
      <Radio value="net30">Net 30</Radio>
    </RadioGroup>
  ),
};
