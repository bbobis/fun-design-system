import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { CheckboxGroup, CheckboxGroupItem } from './checkbox-group';

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
