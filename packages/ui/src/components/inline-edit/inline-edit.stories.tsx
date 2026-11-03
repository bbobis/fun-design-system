import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../badge';
import { Button } from '../button';
import { Heading } from '../heading';
import { InlineEdit } from './inline-edit';

const meta = {
  title: 'Components/InlineEdit',
  component: InlineEdit,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    label: 'Invoice title',
    value: 'Q4 retainer',
    onSave: () => undefined,
    size: 'md',
  },
  argTypes: { size: { control: 'radio', options: ['sm', 'md', 'lg'] } },
} satisfies Meta<typeof InlineEdit>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Click the text, or Tab to it and press Enter. Enter or ✓ saves, Escape or ✕
 * cancels; focus comes back to the text. Clicking elsewhere saves.
 */
export const Playground: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <InlineEdit {...args} value={value} onSave={setValue} />;
  },
};

/**
 * An invoice title as the page's `<h1>`, at `size="lg"`. The heading holds the edit
 * button, so the heading's text is still the title. (PageHeader's `title` is plain
 * text on purpose: it also names the back link and section nav.)
 */
export const AsPageTitle: Story = {
  render: function Render() {
    const [title, setTitle] = useState('Q4 retainer');
    return (
      <div className="flex max-w-3xl items-start justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Heading level={1} size="lg">
            <InlineEdit
              label="Invoice title"
              value={title}
              onSave={setTitle}
              size="lg"
              validate={(v) => (v ? undefined : 'Enter a title.')}
            />
          </Heading>
          <span>
            <Badge tone="info">Sent</Badge>
          </span>
        </div>
        <Button intent="secondary">Download PDF</Button>
      </div>
    );
  },
};

const rows = [
  { id: 'INV-1044', customer: 'Acme Corp', note: 'Split into two payments' },
  { id: 'INV-1043', customer: 'Cobalt Health', note: '' },
  { id: 'INV-1042', customer: 'Delta Foods', note: 'PO arrives Friday' },
];

/**
 * In a table: `size="sm"`, one per row. The empty note shows "Add a note". Each
 * button's name says which row: "Add a note, edit Note for INV-1043".
 */
export const InATable: Story = {
  render: function Render() {
    const [notes, setNotes] = useState(
      Object.fromEntries(rows.map((r) => [r.id, r.note])),
    );
    return (
      <table className="w-full max-w-2xl border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-start text-fg-muted">
            <th className="py-2 text-start font-medium">Invoice</th>
            <th className="py-2 text-start font-medium">Customer</th>
            <th className="w-1/2 py-2 text-start font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="py-2 font-mono">{r.id}</td>
              <td className="py-2">{r.customer}</td>
              <td className="py-1.5">
                <InlineEdit
                  size="sm"
                  label={`Note for ${r.id}`}
                  value={notes[r.id] ?? ''}
                  placeholder="Add a note"
                  onSave={(next) => setNotes((n) => ({ ...n, [r.id]: next }))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
};

/**
 * A slow save that fails: spinner while it runs (the input is read-only), then the
 * error under it, with your text kept. Try "ok" to make it succeed.
 */
export const FailingSave: Story = {
  render: function Render() {
    const [value, setValue] = useState('Q4 retainer');
    return (
      <div className="max-w-sm">
        <InlineEdit
          label="Invoice title"
          value={value}
          onSave={(next) =>
            new Promise<void>((resolve, reject) =>
              setTimeout(() => {
                if (next === 'ok') {
                  setValue(next);
                  resolve();
                } else
                  reject(new Error('The server didn’t respond. Try again.'));
              }, 1200),
            )
          }
        />
      </div>
    );
  },
};
