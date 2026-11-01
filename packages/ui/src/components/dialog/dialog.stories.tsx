import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Field } from '../field';
import { Input } from '../input';
import { Select, type SelectOption } from '../select';
import { AlertDialog, Dialog } from './dialog';

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // Each story renders its own stateful example; these only satisfy the required props.
  args: { open: false, onOpenChange: () => undefined, title: 'Dialog' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const statuses: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
];

/**
 * A form in a dialog. Press **Edit invoice**, then Tab: focus stays inside. Escape, the
 * × or a click on the dimmed page closes it, and focus goes back to the button.
 */
export const EditForm: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Edit invoice</Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title="Edit invoice INV-10042"
            description="Changes apply to this invoice only."
            footer={
              <>
                <Button intent="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpen(false)}>Save changes</Button>
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <Field label="Customer" required>
                <Input defaultValue="Northwind Traders" />
              </Field>
              <Field label="Status">
                <Select options={statuses} defaultValue="pending" />
              </Field>
            </div>
          </Dialog>
        </>
      );
    }
    return <Example />;
  },
};

/** `size`: `sm` for a question, `md` (default) for a short form, `lg` for details. */
export const Sizes: Story = {
  render: () => {
    function Example() {
      const [size, setSize] = useState<
        'sm' | 'md' | 'lg' | 'xl' | 'full' | null
      >(null);
      return (
        <div className="flex flex-wrap gap-2">
          {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((s) => (
            <Button key={s} intent="secondary" onClick={() => setSize(s)}>
              Open {s}
            </Button>
          ))}
          <Dialog
            open={size !== null}
            onOpenChange={(o) => !o && setSize(null)}
            title={`Size ${size ?? ''}`}
            size={size ?? 'md'}
          >
            <p>
              A long body scrolls inside the dialog; the title and buttons stay
              put.
            </p>
          </Dialog>
        </div>
      );
    }
    return <Example />;
  },
};

/**
 * "Are you sure?". Focus starts on **Cancel**. A click outside does nothing; Escape
 * means Cancel. The delete takes 1.5 s: the button shows a spinner meanwhile.
 */
export const ConfirmDelete: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      const [deleted, setDeleted] = useState(0);
      return (
        <div className="flex items-center gap-4">
          <Button intent="danger" onClick={() => setOpen(true)}>
            Delete 3 invoices
          </Button>
          <span className="text-sm text-fg-muted">Deleted: {deleted}</span>
          <AlertDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete 3 invoices?"
            description="They're removed for everyone. This can't be undone."
            confirmLabel="Delete invoices"
            onConfirm={() =>
              new Promise<void>((resolve) =>
                setTimeout(() => {
                  setDeleted((d) => d + 3);
                  resolve();
                }, 1500),
              )
            }
          />
        </div>
      );
    }
    return <Example />;
  },
};

/** The action failed: the dialog stays open and says why. Try it twice. */
export const ConfirmFails: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      const [error, setError] = useState<string | null>(null);
      return (
        <>
          <Button
            intent="danger"
            onClick={() => {
              setError(null);
              setOpen(true);
            }}
          >
            Void invoice
          </Button>
          <AlertDialog
            open={open}
            onOpenChange={setOpen}
            title="Void INV-10042?"
            description={
              error ? (
                <span className="text-fg-danger">{error}</span>
              ) : (
                'The customer is notified by email.'
              )
            }
            confirmLabel="Void invoice"
            onConfirm={async () => {
              await new Promise((r) => setTimeout(r, 800));
              setError('The server is not responding. Try again.');
              throw new Error('offline');
            }}
          />
        </>
      );
    }
    return <Example />;
  },
};

/**
 * `divided`: lines under the header and above the footer. With a long body that
 * scrolls, they show where the fixed parts end.
 */
export const Divided: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Review changes</Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            divided
            size="lg"
            title="Review 24 changes"
            description="Price updates from the October import."
            footer={
              <>
                <Button intent="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setOpen(false)}>Apply changes</Button>
              </>
            }
          >
            <ul className="flex flex-col divide-y divide-border">
              {Array.from({ length: 24 }, (_, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span>SKU-{1040 + i}</span>
                  <span className="text-fg-muted tabular-nums">
                    ${(12 + i * 1.5).toFixed(2)} → ${(13 + i * 1.6).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </Dialog>
        </>
      );
    }
    return <Example />;
  },
};

const customers = [
  'Acme Corp',
  'Globex',
  'Initech',
  'Northwind Traders',
  'Umbrella Health',
  'Wayne Enterprises',
  'Stark Industries',
  'Wonka Foods',
];

/**
 * `placement="top"`: the dialog sits near the top. Type in the box: the list grows
 * and shrinks, but the input stays where it is. Centered, the whole dialog would
 * move up and down as you type.
 */
export const PinnedToTop: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      const [query, setQuery] = useState('');
      const matches = customers.filter((c) =>
        c.toLowerCase().includes(query.toLowerCase()),
      );
      return (
        <>
          <Button onClick={() => setOpen(true)}>Find customer</Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            placement="top"
            title="Find customer"
          >
            <Field label="Name">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </Field>
            <ul className="mt-3 flex flex-col gap-1" aria-live="polite">
              {matches.map((c) => (
                <li key={c} className="rounded-md px-2 py-1.5 hover:bg-surface">
                  {c}
                </li>
              ))}
              {matches.length === 0 && (
                <li className="px-2 py-1.5 text-fg-muted">
                  No customers found
                </li>
              )}
            </ul>
          </Dialog>
        </>
      );
    }
    return <Example />;
  },
};

/**
 * AlertDialog `tone`: an icon in a colored circle. The title still says what's at
 * stake; the icon is decoration (hidden from screen readers).
 */
export const AlertTones: Story = {
  render: () => {
    function Example() {
      const [tone, setTone] = useState<'info' | 'warning' | 'danger' | null>(
        null,
      );
      const copy = {
        info: {
          title: 'Send 12 reminders?',
          description:
            'Each customer gets one email about their overdue invoice.',
          confirm: 'Send reminders',
          intent: 'primary' as const,
        },
        warning: {
          title: 'Leave without saving?',
          description: 'Your changes to this invoice will be lost.',
          confirm: 'Leave page',
          intent: 'danger' as const,
        },
        danger: {
          title: 'Delete 3 invoices?',
          description: "They're removed for everyone. This can't be undone.",
          confirm: 'Delete invoices',
          intent: 'danger' as const,
        },
      };
      const c = copy[tone ?? 'danger'];
      return (
        <div className="flex gap-2">
          {(['info', 'warning', 'danger'] as const).map((t) => (
            <Button key={t} intent="secondary" onClick={() => setTone(t)}>
              {t}
            </Button>
          ))}
          <AlertDialog
            open={tone !== null}
            onOpenChange={(o) => !o && setTone(null)}
            tone={tone ?? 'danger'}
            title={c.title}
            description={c.description}
            confirmLabel={c.confirm}
            intent={c.intent}
            onConfirm={() => undefined}
          />
        </div>
      );
    }
    return <Example />;
  },
};

/**
 * `layout="center"`: icon on top, centered text, buttons sharing the width. On a
 * narrow screen the buttons stack with the main action on top, but Tab still goes
 * Cancel → Delete (only the look is reversed).
 */
export const AlertCentered: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button intent="danger" onClick={() => setOpen(true)}>
            Delete account
          </Button>
          <AlertDialog
            open={open}
            onOpenChange={setOpen}
            tone="danger"
            layout="center"
            title="Delete your account?"
            description="Your invoices and customers are deleted after 30 days."
            confirmLabel="Delete account"
            onConfirm={() => undefined}
          />
        </>
      );
    }
    return <Example />;
  },
};
