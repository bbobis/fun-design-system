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
      const [size, setSize] = useState<'sm' | 'md' | 'lg' | null>(null);
      return (
        <div className="flex gap-2">
          {(['sm', 'md', 'lg'] as const).map((s) => (
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
