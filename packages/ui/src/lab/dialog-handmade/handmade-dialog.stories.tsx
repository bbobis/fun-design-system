import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../../components/button';
import { Field } from '../../components/field';
import { Input } from '../../components/input';
import { HandmadeDialog } from './handmade-dialog';

/**
 * Phase 4 lab. A modal built with no headless library, to see what one saves us.
 * Not exported from the package. Try it with the keyboard only:
 * Enter to open, Tab / Shift+Tab to cycle, Esc to close, and watch where focus lands.
 */
const meta = {
  title: 'Lab/Hand-made Dialog',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ConfirmDelete: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col items-start gap-3">
          <Button intent="danger" onClick={() => setOpen(true)}>
            Delete invoice
          </Button>
          <HandmadeDialog
            open={open}
            onOpenChange={setOpen}
            title="Delete INV-10242?"
            description="The invoice and its payment history will be removed. This can't be undone."
          >
            <div className="mt-4 flex justify-end gap-2">
              <Button intent="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button intent="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </div>
          </HandmadeDialog>
        </div>
      );
    }
    return <Example />;
  },
};

/** A form inside the dialog: Tab cycles through the fields and buttons only. */
export const EditCustomer: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col items-start gap-3">
          <Button intent="secondary" onClick={() => setOpen(true)}>
            Edit customer
          </Button>
          <HandmadeDialog
            open={open}
            onOpenChange={setOpen}
            title="Edit Northwind Traders"
          >
            <form
              className="mt-2 flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
            >
              <Field label="Display name">
                <Input defaultValue="Northwind Traders" />
              </Field>
              <Field
                label="Billing email"
                description="Invoices are sent here."
              >
                <Input type="email" defaultValue="ap@northwind.example" />
              </Field>
              <div className="flex justify-end gap-2">
                <Button intent="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </HandmadeDialog>
        </div>
      );
    }
    return <Example />;
  },
};
