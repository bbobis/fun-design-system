import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Text } from '../text';
import { SplitPanes } from './split-panes';

const meta = {
  title: 'Layout/SplitPanes',
  component: SplitPanes,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof SplitPanes>;

export default meta;
type Story = StoryObj<typeof meta>;

const messages = [
  ['Acme Corp', 'INV-1044 paid', '9:32 AM'],
  ['Cobalt Health', 'Question about the October invoice', '8:10 AM'],
  ['Delta Foods', 'New PO number for next month', 'Yesterday'],
  ['Northwind Traders', 'Re: payment plan', 'Mon'],
  ['Acme Corp', 'Updated billing address', 'Oct 28'],
];

function MessageList() {
  return (
    <ul className="divide-y divide-border">
      {messages.map(([from, subject, when], i) => (
        <li key={i} className="flex flex-col gap-0.5 px-3 py-2.5">
          <span className="flex justify-between gap-2 text-sm font-medium">
            <span className="truncate">{from}</span>
            <span className="shrink-0 text-xs font-normal text-fg-muted">
              {when}
            </span>
          </span>
          <span className="truncate text-sm text-fg-muted">{subject}</span>
        </li>
      ))}
    </ul>
  );
}

function ReadingPane() {
  return (
    <article className="flex flex-col gap-2 p-5">
      <h2 className="text-lg font-semibold">INV-1044 paid</h2>
      <Text size="sm" tone="muted">
        From Acme Corp · 9:32 AM
      </Text>
      <Text>
        Hi, we&apos;ve sent $4,200.00 for INV-1044 by card. Could you send a
        receipt to billing@acme.example? Thanks!
      </Text>
    </article>
  );
}

const frame = 'h-80 rounded-md border border-border bg-bg';

/**
 * A mail list and its reading pane. Drag the handle, or Tab to it and use ←/→ (Shift:
 * faster), Home/End for the smallest / largest size. Screen readers hear "Message
 * list, separator, 35".
 */
export const ListAndReadingPane: Story = {
  args: {
    separatorLabel: 'Message list',
    defaultSize: 35,
    min: 20,
    max: 60,
    primary: <MessageList />,
    secondary: <ReadingPane />,
    className: frame,
  },
};

/**
 * `orientation="vertical"`: stacked, ↑/↓ move the handle. The box needs a height.
 */
export const EditorAndConsole: Story = {
  args: {
    orientation: 'vertical',
    separatorLabel: 'Editor',
    defaultSize: 65,
    min: 30,
    max: 85,
    className: frame,
    primary: (
      <pre className="p-4 font-mono text-sm">
        {`export function total(lines) {\n  return lines.reduce((sum, l) => sum + l.amount, 0);\n}`}
      </pre>
    ),
    secondary: (
      <pre className="h-full bg-surface p-4 font-mono text-xs text-fg-muted">
        {`> total(invoice.lines)\n4200`}
      </pre>
    ),
  },
};

/**
 * `collapsible`: Enter on the handle hides the filters and brings them back at their
 * last size. A hidden pane is out of the tab order. The size is saved with
 * `onSizeChange` (shown under the box), so an app could remember it per user.
 */
export const CollapsibleSidebar: Story = {
  args: {
    separatorLabel: 'Filters',
    primary: null,
    secondary: null,
  },
  render: function Render() {
    const [size, setSize] = useState(25);
    return (
      <div className="flex flex-col gap-2">
        <SplitPanes
          separatorLabel="Filters"
          size={size}
          onSizeChange={setSize}
          min={15}
          max={40}
          collapsible
          className={frame}
          primary={
            <div className="flex flex-col gap-2 p-4 text-sm">
              <span className="font-medium">Filters</span>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked /> Unpaid
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" /> Overdue
              </label>
            </div>
          }
          secondary={<ReadingPane />}
        />
        <Text size="sm" tone="muted">
          Saved size: {size}%
        </Text>
      </div>
    );
  },
};

/**
 * Right-to-left (`dir="rtl"`): the list is on the right. Arrows follow the handle on
 * screen, so → moves it right and the list gets smaller.
 */
export const RightToLeft: Story = {
  args: ListAndReadingPane.args,
  render: (args) => (
    <div dir="rtl">
      <SplitPanes {...args} />
    </div>
  ),
};
