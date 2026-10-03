import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/badge';
import { Card } from '../components/card';
import { Heading } from '../components/heading';
import { Text } from '../components/text';

/**
 * Text, Heading, Badge and Card working together on a realistic screen.
 * Per-component stories live under Components/.
 */
const meta = {
  title: 'Examples/Invoice summary',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  {
    id: 'INV-10241',
    customer: 'Northwind Traders',
    amount: '1,111.11',
    status: 'Paid',
  },
  {
    id: 'INV-10242',
    customer: 'Il1 Logistics Ltd.',
    amount: '8,888.88',
    status: 'Overdue',
  },
  {
    id: 'INV-10243',
    customer: 'O0 Holdings Inc.',
    amount: '120,450.00',
    status: 'Pending',
  },
  {
    id: 'INV-10244',
    customer: 'Rocky Mtn Supply',
    amount: '7,316.40',
    status: 'Draft',
  },
] as const;

const tone = {
  Paid: 'success',
  Overdue: 'danger',
  Pending: 'warning',
  Draft: 'neutral',
} as const;

export const InvoiceSummary: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        {/* Looks like a page title, but it's h2: the app header already has the h1. */}
        <Heading level={2} size="2xl">
          September invoices
        </Heading>
        <Text tone="muted">4 invoices · last synced 2 minutes ago</Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Outstanding', '$129,338.88'],
          ['Paid this month', '$1,111.11'],
          ['Overdue', '$8,888.88'],
        ].map(([label, value]) => (
          <Card
            key={label}
            as="section"
            aria-label={label}
            padding="sm"
            variant="filled"
          >
            <Text size="sm" tone="muted">
              {label}
            </Text>
            <Text size="lg" weight="semibold" numeric>
              {value}
            </Text>
          </Card>
        ))}
      </div>

      <Card as="section" aria-labelledby="inv-table" padding="none">
        <div className="border-b border-border px-5 py-3">
          <Heading level={3} id="inv-table">
            All invoices
          </Heading>
        </div>
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-left text-fg-muted">
              <th className="px-5 py-2 font-medium">Invoice</th>
              <th className="px-5 py-2 font-medium">Customer</th>
              <th className="px-5 py-2 text-right font-medium">Amount</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-5 py-2 font-mono">{r.id}</td>
                <td className="px-5 py-2">{r.customer}</td>
                <td className="px-5 py-2 text-right">${r.amount}</td>
                <td className="px-5 py-2">
                  <Badge tone={tone[r.status]}>{r.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  ),
};
