import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './switch';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { children: 'Email me when an invoice is paid' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Settings that apply at once: no Save button. Tab to one, Space to flip it. */
export const Settings: Story = {
  render: () => {
    function Example() {
      const [paid, setPaid] = useState(true);
      const [overdue, setOverdue] = useState(false);
      return (
        <div className="flex flex-col gap-3">
          <Switch checked={paid} onChange={setPaid}>
            Email me when an invoice is paid
          </Switch>
          <Switch checked={overdue} onChange={setOverdue}>
            Email me when an invoice is overdue
          </Switch>
          <Switch disabled>Weekly summary (coming soon)</Switch>
        </div>
      );
    }
    return <Example />;
  },
};

/** `size`: sm, md (default), lg. The track, thumb and label text scale together. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Switch size="sm" defaultChecked>
        Small
      </Switch>
      <Switch size="md" defaultChecked>
        Medium (default)
      </Switch>
      <Switch size="lg" defaultChecked>
        Large
      </Switch>
    </div>
  ),
};

/**
 * A settings list: `labelPosition="start"` puts the label first and the switch at the
 * far end; `description` adds a second line (read after the name). Only the visual
 * order changes: Tab and screen readers meet each switch the same way.
 */
export const SettingsList: Story = {
  render: () => (
    <ul className="flex w-96 flex-col divide-y divide-border rounded-lg border border-border">
      {[
        [
          'Email me when an invoice is paid',
          'Sent to billing@acme.example',
          true,
        ],
        ['Weekly summary', 'Every Monday at 8:00', false],
        [
          'Overdue reminders',
          'Sent to customers 3 days after the due date',
          true,
        ],
      ].map(([label, description, on]) => (
        <li key={String(label)} className="px-4 py-3">
          <Switch
            labelPosition="start"
            description={description as string}
            defaultChecked={on as boolean}
          >
            {label as string}
          </Switch>
        </li>
      ))}
    </ul>
  ),
};
