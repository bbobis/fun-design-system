import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { Button } from '../button';
import { CheckboxGroup, CheckboxGroupItem } from '../checkbox-group';
import { Field } from '../field';
import { Input } from '../input';
import { Radio, RadioGroup } from '../radio-group';
import { TextArea } from '../textarea';
import { Drawer, type DrawerProps } from './drawer';

const meta = {
  title: 'Components/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // Each story renders its own stateful example; these only satisfy the required props.
  args: { open: false, onOpenChange: () => undefined, title: 'Drawer' },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A button that opens a drawer; the drawer gets `open`, `onOpenChange` and a close fn. */
function WithTrigger({
  label,
  children,
}: {
  label: string;
  children: (
    state: Pick<DrawerProps, 'open' | 'onOpenChange'> & { close: () => void },
  ) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      {children({ open, onOpenChange: setOpen, close: () => setOpen(false) })}
    </>
  );
}

/**
 * Edit a record without leaving the list. Press **Edit invoice**: focus moves in, Tab
 * stays inside, Escape / × / a click on the dimmed page closes it, and focus goes back
 * to the button.
 */
export const EditRecord: Story = {
  render: () => (
    <WithTrigger label="Edit invoice">
      {({ close, ...state }) => (
        <Drawer
          {...state}
          title="Edit invoice INV-10042"
          description="Northwind Traders · due Nov 30"
          footer={
            <>
              <Button intent="secondary" onClick={close}>
                Cancel
              </Button>
              <Button onClick={close}>Save changes</Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field label="Customer" required>
              <Input defaultValue="Northwind Traders" />
            </Field>
            <Field label="PO number">
              <Input defaultValue="PO-2291" />
            </Field>
            <Field label="Notes">
              <TextArea defaultValue="Net 30. Send a copy to the account rep." />
            </Field>
          </div>
        </Drawer>
      )}
    </WithTrigger>
  ),
};

/** `placement="start"`: filters beside the content they filter. */
export const Filters: Story = {
  render: () => (
    <WithTrigger label="Filters">
      {({ close, ...state }) => (
        <Drawer
          {...state}
          placement="start"
          size="sm"
          title="Filter invoices"
          footer={
            <>
              <Button intent="secondary" onClick={close}>
                Clear
              </Button>
              <Button onClick={close}>Show results</Button>
            </>
          }
        >
          <div className="flex flex-col gap-6">
            <CheckboxGroup label="Status" defaultValue={['sent', 'overdue']}>
              <CheckboxGroupItem value="draft">Draft</CheckboxGroupItem>
              <CheckboxGroupItem value="sent">Sent</CheckboxGroupItem>
              <CheckboxGroupItem value="paid">Paid</CheckboxGroupItem>
              <CheckboxGroupItem value="overdue">Overdue</CheckboxGroupItem>
            </CheckboxGroup>
            <RadioGroup label="Issued" defaultValue="30">
              <Radio value="7">Last 7 days</Radio>
              <Radio value="30">Last 30 days</Radio>
              <Radio value="all">Any time</Radio>
            </RadioGroup>
          </div>
        </Drawer>
      )}
    </WithTrigger>
  ),
};

/** `size`: `sm` (24rem), `md` (28rem, default), `lg` (42rem). Phones always keep a 3rem strip of page. */
export const Sizes: Story = {
  render: () => (
    <div className="flex gap-2">
      {(['sm', 'md', 'lg', 'full'] as const).map((size) => (
        <WithTrigger key={size} label={`Open ${size}`}>
          {(state) => (
            <Drawer {...state} size={size} title={`size="${size}"`}>
              The panel is full height; only its width changes. `full` covers
              the whole screen.
            </Drawer>
          )}
        </WithTrigger>
      ))}
    </div>
  ),
};

/** Long content scrolls inside; the header and footer stay put. */
export const LongContent: Story = {
  render: () => (
    <WithTrigger label="Activity">
      {({ close, ...state }) => (
        <Drawer
          {...state}
          title="Invoice activity"
          footer={<Button onClick={close}>Done</Button>}
        >
          <ol className="flex flex-col gap-3">
            {Array.from({ length: 40 }, (_, i) => (
              <li key={i} className="border-b border-border pb-3">
                <span className="font-medium">Oct {(i % 28) + 1}</span> ·
                Reminder #{i + 1} sent to billing@northwind.example
              </li>
            ))}
          </ol>
        </Drawer>
      )}
    </WithTrigger>
  ),
};

/**
 * Right-to-left (Arabic): `placement="end"` opens from the **left**, and slides in from
 * there. The drawer is portalled to `<body>`, so the story sets `dir` on `<html>`.
 */
export const RightToLeft: Story = {
  decorators: [
    (Story) => {
      useEffect(() => {
        const html = document.documentElement;
        const before = html.dir;
        html.dir = 'rtl';
        return () => {
          html.dir = before;
        };
      }, []);
      return (
        <I18nProvider locale="ar-EG">
          <Story />
        </I18nProvider>
      );
    },
  ],
  render: () => (
    <WithTrigger label="تعديل الفاتورة">
      {({ close, ...state }) => (
        <Drawer
          {...state}
          title="تعديل الفاتورة"
          footer={
            <>
              <Button intent="secondary" onClick={close}>
                إلغاء
              </Button>
              <Button onClick={close}>حفظ</Button>
            </>
          }
        >
          <Field label="العميل">
            <Input defaultValue="نورثويند" />
          </Field>
        </Drawer>
      )}
    </WithTrigger>
  ),
};

/**
 * A bottom sheet: `placement="bottom"`. Full width, as tall as its content (up to
 * `size`), rounded on the edge facing the page. Good for a short list of actions on
 * a phone. Escape, the × or a tap on the page above closes it.
 */
export const BottomSheet: Story = {
  render: () => (
    <WithTrigger label="Invoice actions">
      {({ close, ...state }) => (
        <Drawer
          {...state}
          placement="bottom"
          title="INV-2041"
          description="Northwind Traders · $1,280.00"
        >
          {/* -mx-4 lines the button text up with the title (Button has px-4). */}
          <div className="-mx-4 flex flex-col gap-1">
            {['Send reminder', 'Download PDF', 'Duplicate', 'Mark as paid'].map(
              (action) => (
                <Button
                  key={action}
                  intent="ghost"
                  className="justify-start"
                  onClick={close}
                >
                  {action}
                </Button>
              ),
            )}
          </div>
        </Drawer>
      )}
    </WithTrigger>
  ),
};

/** All four edges. `top` and `bottom` slide along the vertical axis. */
export const Placements: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['start', 'end', 'top', 'bottom'] as const).map((placement) => (
        <WithTrigger key={placement} label={placement}>
          {(state) => (
            <Drawer
              {...state}
              placement={placement}
              title={`placement="${placement}"`}
            >
              Slides in from the {placement} edge.
            </Drawer>
          )}
        </WithTrigger>
      ))}
    </div>
  ),
};
