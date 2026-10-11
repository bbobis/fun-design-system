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
