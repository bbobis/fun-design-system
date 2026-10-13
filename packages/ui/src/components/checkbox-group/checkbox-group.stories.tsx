import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  CheckboxCard,
  CheckboxGroup,
  CheckboxGroupItem,
} from './checkbox-group';

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Send copies to', children: null },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tab moves box to box (each is a Tab stop); Space toggles. */
export const Default: Story = {
  render: () => {
    function Example() {
      const [copies, setCopies] = useState<string[]>(['customer']);
      return (
        <div className="flex flex-col gap-3">
          <CheckboxGroup
            label="Send copies to"
            description="Everyone checked gets the invoice by email."
            value={copies}
            onChange={setCopies}
          >
            <CheckboxGroupItem value="customer">Customer</CheckboxGroupItem>
            <CheckboxGroupItem
              value="rep"
              description="The account's sales rep"
            >
              Sales rep
            </CheckboxGroupItem>
            <CheckboxGroupItem
              value="finance"
              disabled
              description="Always copied"
            >
              Finance
            </CheckboxGroupItem>
          </CheckboxGroup>
          <p className="text-sm text-fg-muted">
            Value: <code>{JSON.stringify(copies)}</code>
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

export const Horizontal: Story = {
  render: () => (
    <CheckboxGroup
      label="Show columns"
      orientation="horizontal"
      defaultValue={['status', 'total']}
    >
      <CheckboxGroupItem value="status">Status</CheckboxGroupItem>
      <CheckboxGroupItem value="due">Due</CheckboxGroupItem>
      <CheckboxGroupItem value="total">Total</CheckboxGroupItem>
    </CheckboxGroup>
  ),
};

export const WithError: Story = {
  render: () => (
    <CheckboxGroup
      label="Send copies to"
      required
      error="Choose who gets a copy."
    >
      <CheckboxGroupItem value="customer">Customer</CheckboxGroupItem>
      <CheckboxGroupItem value="rep">Sales rep</CheckboxGroupItem>
    </CheckboxGroup>
  ),
};

const addOns = [
  {
    id: 'sso',
    title: 'Single sign-on',
    description: 'Okta, Azure AD, Google',
    price: 5,
  },
  {
    id: 'audit',
    title: 'Audit log',
    description: 'Every change, kept 1 year',
    price: 2,
  },
  {
    id: 'api',
    title: 'API access',
    description: 'Coming soon',
    price: 3,
    disabled: true,
  },
];

/**
 * `CheckboxCard`: pick any number. Unlike RadioCard, **each card is a Tab stop** and
 * Space toggles it; arrow keys do nothing. A screen reader hears "Audit log, checkbox,
 * not checked, Every change, kept 1 year".
 */
export const Cards: Story = {
  render: function Render() {
    const [chosen, setChosen] = useState<string[]>(['sso']);
    const total = addOns
      .filter((a) => chosen.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
    return (
      <div className="flex max-w-2xl flex-col gap-3">
        <CheckboxGroup
          label="Add-ons"
          description="Billed per user, per month."
          orientation="horizontal"
          value={chosen}
          onChange={setChosen}
        >
          {addOns.map((a) => (
            <CheckboxCard
              key={a.id}
              value={a.id}
              title={a.title}
              description={a.description}
              disabled={a.disabled}
            >
              <span className="font-semibold tabular-nums">+${a.price}</span>
              <span className="text-fg-muted"> / user</span>
            </CheckboxCard>
          ))}
        </CheckboxGroup>
        <p className="text-sm text-fg-muted">
          Add-ons: <code>{JSON.stringify(chosen)}</code> · ${total} / user
        </p>
      </div>
    );
  },
};

/** Stacked (the default vertical orientation), required, with an error. */
export const CardsWithError: Story = {
  render: () => (
    <div className="max-w-sm">
      <CheckboxGroup
        label="Notify me about"
        required
        error="Choose at least one."
      >
        <CheckboxCard
          value="paid"
          title="Payments"
          description="When an invoice is paid"
        />
        <CheckboxCard
          value="overdue"
          title="Overdue invoices"
          description="The day after the due date"
        />
      </CheckboxGroup>
    </div>
  ),
};
