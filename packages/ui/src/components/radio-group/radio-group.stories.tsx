import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Radio, RadioCard, RadioGroup } from './radio-group';

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

const Price = ({ amount, per }: { amount: string; per?: string }) => (
  <span>
    <span className="text-lg font-semibold tabular-nums">{amount}</span>
    {per && <span className="text-fg-muted"> / {per}</span>}
  </span>
);

/**
 * `RadioCard`: the whole card is the radio. Same keyboard as any RadioGroup: Tab in,
 * ←/→ move *and* choose. A screen reader hears "Pro, radio button, Up to 10 users".
 */
export const Cards: Story = {
  render: function Render() {
    const [plan, setPlan] = useState<string>('pro');
    return (
      <div className="flex max-w-2xl flex-col gap-3">
        <RadioGroup
          label="Plan"
          description="You can change this later."
          orientation="horizontal"
          value={plan}
          onChange={setPlan}
        >
          <RadioCard
            value="free"
            title="Free"
            description="1 user, 20 invoices a month"
          >
            <Price amount="$0" />
          </RadioCard>
          <RadioCard value="pro" title="Pro" description="Up to 10 users">
            <Price amount="$29" per="month" />
          </RadioCard>
          <RadioCard
            value="enterprise"
            title="Enterprise"
            description="Talk to sales"
            disabled
          >
            <Price amount="Custom" />
          </RadioCard>
        </RadioGroup>
        <p className="text-sm text-fg-muted">
          Chosen: <code>{plan}</code>
        </p>
      </div>
    );
  },
};

/** Stacked cards (the default vertical orientation), with an error. */
export const CardsWithError: Story = {
  render: () => (
    <div className="max-w-sm">
      <RadioGroup label="Shipping" required error="Choose a shipping option.">
        <RadioCard
          value="standard"
          title="Standard"
          description="5–7 business days"
        >
          Free
        </RadioCard>
        <RadioCard
          value="express"
          title="Express"
          description="1–2 business days"
        >
          $14.00
        </RadioCard>
      </RadioGroup>
    </div>
  ),
};
