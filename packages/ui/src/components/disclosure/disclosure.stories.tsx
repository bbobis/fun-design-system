import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Accordion, Disclosure } from './disclosure';

const meta = {
  title: 'Components/Disclosure',
  component: Disclosure,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { title: 'Section', children: null },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Disclosure>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * An FAQ. Tab between the questions; Enter or Space opens one (and closes the other).
 * Try Ctrl/⌘+F for "refund" while its answer is closed.
 */
export const Faq: Story = {
  render: () => (
    <Accordion defaultExpandedIds={['invoices']}>
      <Disclosure id="invoices" title="Where can I find my invoices?">
        Every invoice is under Billing → Invoices. You can download each one as
        a PDF or export them all as CSV.
      </Disclosure>
      <Disclosure id="refunds" title="How do refunds work?">
        A refund goes back to the card you paid with, usually within 5 business
        days. Credit notes are issued for partial refunds.
      </Disclosure>
      <Disclosure id="currency" title="Can I change my billing currency?">
        Yes, once per year, from Billing → Settings. Open invoices keep their
        original currency.
      </Disclosure>
      <Disclosure id="legacy" title="Legacy plans (no longer offered)" disabled>
        Not shown.
      </Disclosure>
    </Accordion>
  ),
};

/** `allowsMultiple`: several sections open at once (settings groups, filter panels). */
export const MultipleOpen: Story = {
  render: function Render() {
    const [open, setOpen] = useState<string[]>(['status', 'amount']);
    return (
      <div className="flex flex-col gap-2">
        <Accordion allowsMultiple expandedIds={open} onExpandedChange={setOpen}>
          <Disclosure id="status" title="Status">
            Draft, Sent, Paid, Overdue
          </Disclosure>
          <Disclosure id="amount" title="Amount">
            Between $0 and $10,000
          </Disclosure>
          <Disclosure id="dates" title="Dates">
            Issued in the last 30 days
          </Disclosure>
        </Accordion>
        <p className="text-sm text-fg-muted">
          Open: <code>{JSON.stringify(open)}</code>
        </p>
      </div>
    );
  },
};

/** One section on its own: "Show advanced settings". */
export const Standalone: Story = {
  args: {
    title: 'Advanced settings',
    children:
      'Webhook URL, retry policy and API rate limits. Most teams never need to change these.',
  },
};
