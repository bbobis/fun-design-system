import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Alert } from './alert';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    tone: 'info',
    title: 'Exchange rates update at 6:00 every morning',
    children: 'Amounts in USD and EUR use yesterday’s rate until then.',
  },
  argTypes: {
    tone: {
      control: 'radio',
      options: ['info', 'success', 'warning', 'danger'],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** All four tones. Each one also says its tone in words for screen readers. */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert tone="info" title="3 invoices are waiting for approval" />
      <Alert tone="success" title="Import finished">
        1,240 rows added, 0 skipped.
      </Alert>
      <Alert tone="warning" title="Exchange rates are 2 days old">
        Totals in USD and EUR may be off until the next update.
      </Alert>
      <Alert tone="danger" title="Payment could not be processed">
        The card was declined. Ask the customer for another payment method.
      </Alert>
    </div>
  ),
};

/**
 * Appears after something fails, with `announce`: screen readers read it at once.
 * It has a Retry action and can be dismissed.
 */
export const AfterAFailedSave: Story = {
  render: () => {
    function Example() {
      const [failed, setFailed] = useState(false);
      return (
        <div className="flex flex-col gap-3">
          <Button className="self-start" onClick={() => setFailed(true)}>
            Save (fails)
          </Button>
          {failed && (
            <Alert
              tone="danger"
              title="Couldn’t save your changes"
              announce
              onDismiss={() => setFailed(false)}
              actions={
                <Button
                  size="sm"
                  intent="secondary"
                  onClick={() => setFailed(false)}
                >
                  Retry
                </Button>
              }
            >
              The server didn’t respond. Your changes are still here.
            </Alert>
          )}
        </div>
      );
    }
    return <Example />;
  },
};
