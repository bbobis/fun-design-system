import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { CheckboxGroup, CheckboxGroupItem } from '../checkbox-group';
import { Radio, RadioGroup } from '../radio-group';
import { Field } from '../field';
import { Input } from '../input';
import { Select, type SelectOption } from '../select';
import { Popover } from './popover';

const meta: Meta<typeof Popover> = {
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
};

export default meta;
// Popover's props are a union (label OR trigger), so type stories from the component.
type Story = StoryObj<typeof Popover>;

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

/* ---------------------------------------------------------------------------------
 * Content recipes: which kind of content goes in a Popover, and how to set it up.
 * ------------------------------------------------------------------------------ */

/**
 * **Recipe: a form with actions.** `title`, `description`, `closeButton` and a pinned
 * `footer`. The footer gets `close` so **Apply** can commit and close; Escape or a
 * click outside closes without applying.
 */
export const RecipeForm: Story = {
  render: function Render() {
    const [applied, setApplied] = useState<string[]>(['sent', 'overdue']);
    const [draft, setDraft] = useState<string[]>(applied);
    return (
      <div className="flex flex-col items-start gap-2">
        <Popover
          label="Status"
          title="Filter by status"
          description="Applies to this list only."
          closeButton
          onOpenChange={(isOpen) => isOpen && setDraft(applied)}
          footer={({ close }) => (
            <>
              <Button intent="secondary" size="sm" onClick={() => setDraft([])}>
                Clear
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
            </>
          )}
        >
          <CheckboxGroup label="Status" value={draft} onChange={setDraft}>
            <CheckboxGroupItem value="draft">Draft</CheckboxGroupItem>
            <CheckboxGroupItem value="sent">Sent</CheckboxGroupItem>
            <CheckboxGroupItem value="paid">Paid</CheckboxGroupItem>
            <CheckboxGroupItem value="overdue">Overdue</CheckboxGroupItem>
          </CheckboxGroup>
        </Popover>
        <p className="text-sm text-fg-muted">
          Applied: <code>{JSON.stringify(applied)}</code>
        </p>
      </div>
    );
  },
};

const people = ['Ana Silva', 'Ben Bobis', 'Chen Wei', 'Dana Okafor'];

/**
 * **Recipe: pick one, done.** No footer: choosing closes the panel straight away
 * (children as a function get `close`). Arrow keys move through the choices.
 */
export const RecipePickOne: Story = {
  render: function Render() {
    const [owner, setOwner] = useState('Ben Bobis');
    return (
      <Popover label={`Owner: ${owner}`} title="Assign to" panelSize="sm">
        {({ close }) => (
          <RadioGroup
            label="Person"
            value={owner}
            onChange={(v) => {
              setOwner(v);
              close();
            }}
          >
            {people.map((p) => (
              <Radio key={p} value={p}>
                {p}
              </Radio>
            ))}
          </RadioGroup>
        )}
      </Popover>
    );
  },
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('');

/**
 * **Recipe: details about something**, from your own trigger (`trigger`): a ghost
 * Button holding an avatar and a name. Read-only content, with an `arrow` pointing at
 * what it describes, and a `title` so the panel has its own clear name.
 */
export const RecipeDetails: Story = {
  render: () => (
    <Popover
      arrow
      panelSize="sm"
      // Name the panel itself. Without a title it's named from the trigger's content,
      // and Chrome then reads the hidden initials ("DO") instead of "Dana Okafor".
      title="Dana Okafor"
      trigger={
        <Button intent="ghost" size="sm" className="gap-2 ps-1">
          <span
            aria-hidden="true"
            className="flex size-6 items-center justify-center rounded-full bg-surface text-xs font-semibold"
          >
            {initials('Dana Okafor')}
          </span>
          Dana Okafor
        </Button>
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-fg-muted">Role</dt>
        <dd>Accounts receivable</dd>
        <dt className="text-fg-muted">Email</dt>
        <dd>dana@northwind.example</dd>
        <dt className="text-fg-muted">Open</dt>
        <dd className="tabular-nums">7 invoices</dd>
      </dl>
    </Popover>
  ),
};

/**
 * **Recipe: help with a link.** An icon-only `trigger` (with `aria-label`), an `arrow`
 * and `panelSize="auto"` so short text doesn't sit in a wide box. Use this, not a
 * Tooltip, when there's something to click inside: tooltips vanish when you move to them.
 */
export const RecipeHelp: Story = {
  render: () => (
    <div className="flex items-center gap-1 text-sm">
      Due date
      <Popover
        arrow
        panelSize="auto"
        placement="end"
        trigger={
          <Button
            intent="ghost"
            size="sm"
            aria-label="About due dates"
            className="size-6 rounded-full p-0"
          >
            ?
          </Button>
        }
      >
        <p className="max-w-60">
          The due date follows the customer&apos;s payment terms (Net 30 unless
          set).{' '}
          <a
            href="#payment-terms"
            className="font-medium underline decoration-link-underline decoration-2 underline-offset-4"
          >
            Change terms
          </a>
        </p>
      </Popover>
    </div>
  ),
};

/**
 * **Recipe: long content.** The body scrolls; the header (with ×) and the footer stay
 * in place.
 */
export const RecipeLongContent: Story = {
  render: () => (
    <Popover
      label="Activity"
      title="Invoice activity"
      closeButton
      panelSize="lg"
      footer={({ close }) => (
        <Button size="sm" onClick={close}>
          Done
        </Button>
      )}
    >
      <ol className="flex flex-col gap-2">
        {Array.from({ length: 30 }, (_, i) => (
          <li key={i} className="border-b border-border pb-2">
            Oct {(i % 28) + 1} · Reminder #{i + 1} sent
          </li>
        ))}
      </ol>
    </Popover>
  ),
};
