import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Field } from '../field';
import { Input } from '../input';
import { Select, type SelectOption } from '../select';
import { Popover } from './popover';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { label: 'Filters', children: null },
  decorators: [
    (Story) => (
      <div className="min-h-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const statuses: SelectOption[] = [
  { value: 'any', label: 'Any status' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
];

type Filters = { status: string; customer: string };
const noFilters: Filters = { status: 'any', customer: '' };

/**
 * A filter panel. The fields are a draft: **Apply** commits them and closes (children
 * as a function get `close`); Escape or a click outside closes without applying.
 */
export const FilterPanel: Story = {
  render: () => {
    function Example() {
      const [applied, setApplied] = useState<Filters>(noFilters);
      const [draft, setDraft] = useState<Filters>(noFilters);
      const count =
        Number(applied.status !== 'any') + Number(applied.customer !== '');
      return (
        <div className="flex items-start gap-4">
          <Popover
            label={count ? `Filters (${count})` : 'Filters'}
            title="Filter invoices"
            onOpenChange={(isOpen) => isOpen && setDraft(applied)}
          >
            {({ close }) => (
              <div className="flex flex-col gap-4">
                <Field label="Status">
                  <Select
                    options={statuses}
                    value={draft.status}
                    onChange={(status) =>
                      setDraft((d) => ({ ...d, status: status ?? 'any' }))
                    }
                  />
                </Field>
                <Field label="Customer contains">
                  <Input
                    value={draft.customer}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, customer: e.target.value }))
                    }
                  />
                </Field>
                <div className="flex justify-end gap-2">
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => setDraft(noFilters)}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setApplied(draft);
                      close();
                    }}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
          </Popover>
          <span className="text-sm text-fg-muted">
            Applied: {applied.status}
            {applied.customer && `, customer ~ "${applied.customer}"`}
          </span>
        </div>
      );
    }
    return <Example />;
  },
};

/** Read-only details next to the thing they describe. No title: the panel is named after its trigger. */
export const Details: Story = {
  render: () => (
    <Popover label="INV-10042" intent="ghost" size="sm" panelSize="sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-fg-muted">Customer</dt>
        <dd>Northwind Traders</dd>
        <dt className="text-fg-muted">Total</dt>
        <dd className="tabular-nums">12,450.00 CAD</dd>
        <dt className="text-fg-muted">Due</dt>
        <dd className="tabular-nums">2026-11-03</dd>
      </dl>
    </Popover>
  ),
};

/** `placement`: the panel flips by itself when there's no room on the chosen side. */
export const Placements: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 pt-40">
      {(['bottom start', 'bottom end', 'top start', 'end'] as const).map(
        (placement) => (
          <Popover
            key={placement}
            label={placement}
            placement={placement}
            panelSize="sm"
          >
            <p className="text-sm">Opens {placement}.</p>
          </Popover>
        ),
      )}
    </div>
  ),
};
