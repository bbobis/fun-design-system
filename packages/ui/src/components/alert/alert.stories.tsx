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
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    variant: {
      control: 'radio',
      options: ['soft', 'outline', 'bar', 'solid'],
    },
    size: { control: 'radio', options: ['md', 'sm'] },
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

const tones = [
  ['neutral', 'Version 4.2 is available'],
  ['info', '3 invoices are waiting for approval'],
  ['success', 'Import finished: 1,240 rows added'],
  ['warning', 'Exchange rates are 2 days old'],
  ['danger', 'Payment could not be processed'],
] as const;

/**
 * Every tone in every `variant`: `soft` (default), `outline` (quieter, for pages with
 * several alerts), `bar` (a coloured edge, like Toast), `solid` (the one that must not
 * be missed). `neutral` has no tone word for screen readers: it's just news. axe
 * checks each one.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(['soft', 'outline', 'bar', 'solid'] as const).map((variant) => (
        <div key={variant} className="flex flex-col gap-2">
          <p className="text-xs text-fg-muted">{variant}</p>
          {tones.map(([tone, title]) => (
            <Alert key={tone} tone={tone} variant={variant} title={title} />
          ))}
        </div>
      ))}
    </div>
  ),
};

/**
 * `banner`: full-bleed across the top of a page or card. Square, only a bottom edge.
 * It is still an alert (`announce` makes it a live region), not the page's `banner`
 * landmark.
 */
export const Banner: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-2xl overflow-hidden rounded-lg border border-border">
        <Story />
        <div className="p-6 text-sm text-fg-muted">Page content…</div>
      </div>
    ),
  ],
  render: () => {
    function Example() {
      const [open, setOpen] = useState(true);
      return open ? (
        <Alert
          banner
          tone="warning"
          title="Scheduled maintenance tonight, 22:00–23:00 MT"
          onDismiss={() => setOpen(false)}
          actions={
            <Button size="sm" intent="secondary">
              Details
            </Button>
          }
        >
          Invoices can’t be sent during this window.
        </Alert>
      ) : (
        <Alert
          banner
          tone="success"
          variant="outline"
          title="Banner dismissed."
        />
      );
    }
    return <Example />;
  },
};

/**
 * `size="sm"`: one compact line, actions at the end. For tables, cards and side
 * panels. Tab reaches the Retry button and the ×.
 */
export const Compact: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(true);
      return (
        <div className="flex flex-col gap-2">
          {open && (
            <Alert
              size="sm"
              tone="danger"
              title="3 rows failed"
              onDismiss={() => setOpen(false)}
              actions={
                <Button size="sm" intent="secondary">
                  Retry
                </Button>
              }
            >
              Check the highlighted rows.
            </Alert>
          )}
          <Alert size="sm" tone="info" variant="outline" title="Read-only">
            You can view this invoice but not edit it.
          </Alert>
          <Alert size="sm" tone="success" variant="solid" title="Synced" />
        </div>
      );
    }
    return <Example />;
  },
};

/**
 * `icon`: your own icon (here a sparkle for a new feature), or `icon={false}` for none,
 * e.g. in a tight table row where the colour and the words are enough.
 */
export const CustomIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert
        tone="neutral"
        variant="bar"
        icon={
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinejoin="round"
          >
            <path d="M8 1.75 9.5 6.5l4.75 1.5L9.5 9.5 8 14.25 6.5 9.5 1.75 8 6.5 6.5z" />
          </svg>
        }
        title="New: recurring invoices"
      >
        Set an invoice to repeat every month from its menu.
      </Alert>
      <Alert tone="warning" size="sm" icon={false} title="2 rows skipped" />
    </div>
  ),
};
