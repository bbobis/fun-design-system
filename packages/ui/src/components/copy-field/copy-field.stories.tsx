import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { Card } from '../card';
import { Field } from '../field';
import { Heading } from '../heading';
import { Text } from '../text';
import { CopyField } from './copy-field';

const meta = {
  title: 'Components/CopyField',
  component: CopyField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    value: 'https://acme.example/i/INV-1044',
    'aria-label': 'Share link',
  },
  argTypes: { size: { control: 'radio', options: ['sm', 'md', 'lg'] } },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * A secret in a Field. Dots until you press Show ("Show API key, toggle button, not
 * pressed"). Copy copies the real key without showing it; screen readers hear
 * "Copied". Tab into the input to select it all.
 */
export const ApiKey: Story = {
  render: () => (
    <Field
      label="API key"
      description="Keep it secret. Anyone with this key can create invoices."
    >
      <CopyField value="sk_live_51Hx9AbcD7fQ2mZ0lI1O" secret />
    </Field>
  ),
};

/** A developer settings card: two plain values and one secret. */
export const SettingsCard: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level={2} size="md">
            Webhooks
          </Heading>
          <Text size="sm" tone="muted">
            We send invoice events to this endpoint.
          </Text>
        </div>
        <Button intent="secondary" size="sm">
          Rotate secret
        </Button>
      </div>
      <Field label="Endpoint URL">
        <CopyField value="https://hooks.acme.example/billing/v2" />
      </Field>
      <Field label="Webhook ID">
        <CopyField value="wh_01J9ZK4M2T8" mono size="sm" />
      </Field>
      <Field label="Signing secret" description="Used to verify our signature.">
        <CopyField value="whsec_kT3pV9qLx2Nd8Rf0" secret />
      </Field>
    </Card>
  ),
};

/** `size`: matches Input. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <CopyField
          key={size}
          {...args}
          size={size}
          aria-label={`Share link ${size}`}
        />
      ))}
    </div>
  ),
};
