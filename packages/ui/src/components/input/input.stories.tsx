import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
    variant: { control: 'radio', options: ['outline', 'filled'] },
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

/**
 * `variant`: `outline` (default) or `filled`. Filled keeps a strong bottom line: a grey
 * fill alone is too close to the page for the field's edge to be seen (WCAG 1.4.11).
 */
export const Variants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      {(['outline', 'filled'] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-4">
          <Field label={`Customer (${variant})`}>
            <Input variant={variant} placeholder="Acme Ltd" />
          </Field>
          <Field label={`Reference (${variant})`} error="Required.">
            <Input variant={variant} />
          </Field>
          <Field label={`Account (${variant})`} disabled>
            <Input variant={variant} defaultValue="CUST-00042" />
          </Field>
        </div>
      ))}
    </div>
  ),
};

const SearchIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
  >
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </svg>
);
const MailIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinejoin="round"
  >
    <rect x="2" y="3.5" width="12" height="9" rx="1.5" />
    <path d="m2.5 4.5 5.5 4 5.5-4" />
  </svg>
);

/**
 * `startAdornment` / `endAdornment`. Text ("$", "kg", "%") is read with the field
 * ("Weight, 70, kg"). Icons are decoration. A button (show password) stays a button.
 * Click the "$" or "kg": the input gets focus.
 */
export const Adornments: Story = {
  render: () => {
    function Example() {
      const [show, setShow] = useState(false);
      return (
        <div className="flex w-80 flex-col gap-4">
          <Field label="Search">
            <Input
              startAdornment={<SearchIcon />}
              placeholder="Invoices, customers…"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              startAdornment={<MailIcon />}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="Amount">
            <Input
              startAdornment="$"
              endAdornment="CAD"
              inputMode="decimal"
              defaultValue="1,200.00"
            />
          </Field>
          <Field label="Weight">
            <Input
              endAdornment="kg"
              inputMode="decimal"
              defaultValue="70"
              variant="filled"
            />
          </Field>
          <Field label="Password">
            <Input
              type={show ? 'text' : 'password'}
              defaultValue="correct horse"
              endAdornment={
                <Button
                  size="sm"
                  intent="ghost"
                  className="-me-2 h-7 px-2"
                  aria-pressed={show}
                  onClick={() => setShow((v) => !v)}
                >
                  {show ? 'Hide' : 'Show'}
                </Button>
              }
            />
          </Field>
        </div>
      );
    }
    return <Example />;
  },
};

/** Adornments in every size; invalid and disabled draw on the whole box. */
export const AdornmentStates: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Input
          key={size}
          size={size}
          aria-label={`Price (${size})`}
          startAdornment="$"
          endAdornment="CAD"
          defaultValue="99.00"
        />
      ))}
      <Field label="Discount" error="Must be 0–100.">
        <Input endAdornment="%" defaultValue="120" />
      </Field>
      <Field label="Tax rate" disabled>
        <Input endAdornment="%" defaultValue="5" />
      </Field>
    </div>
  ),
};
