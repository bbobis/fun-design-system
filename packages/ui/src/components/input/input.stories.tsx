import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Field } from '../field';
import { Input } from './input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Example',
    placeholder: 'Type here',
    size: 'md',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A bare Input needs its own accessible name. Prefer wrapping it in a Field. */
export const Playground: Story = {};

/** Field wires the label, help text and error to the input. Tab in to hear them read. */
export const InAField: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field label="Email" description="We'll send the invoice here." required>
        <Input type="email" placeholder="name@example.com" />
      </Field>
      <Field
        label="Invoice number"
        error="INV numbers start with INV- and have 5 digits."
      >
        <Input defaultValue="IVN-1024" className="font-mono" />
      </Field>
      <Field label="Customer ID" description="Set by the system." disabled>
        <Input defaultValue="CUST-00042" className="font-mono" />
      </Field>
    </div>
  ),
};

/** Heights match Button, so they line up in a toolbar. */
export const SizesWithButton: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex w-96 gap-2">
          <Input
            size={size}
            aria-label={`Search (${size})`}
            placeholder="Search invoices"
          />
          <Button size={size} intent="secondary">
            Search
          </Button>
        </div>
      ))}
    </div>
  ),
};
