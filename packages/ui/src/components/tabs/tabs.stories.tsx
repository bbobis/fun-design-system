import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from '../badge';
import { Tab, TabList, TabPanel, Tabs } from './tabs';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { children: null },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

function InvoiceTabs(props: Partial<Parameters<typeof Tabs>[0]>) {
  return (
    <Tabs defaultValue="details" {...props}>
      <TabList aria-label="Invoice sections">
        <Tab id="details">Details</Tab>
        <Tab id="lines">
          Lines <Badge>12</Badge>
        </Tab>
        <Tab id="audit" disabled>
          Audit
        </Tab>
        <Tab id="history">History</Tab>
      </TabList>
      <TabPanel id="details">Customer: Acme Ltd · Issued 2026-10-01</TabPanel>
      <TabPanel id="lines">12 invoice lines would be listed here.</TabPanel>
      <TabPanel id="audit">Audit log (needs admin rights).</TabPanel>
      <TabPanel id="history">3 changes since it was created.</TabPanel>
    </Tabs>
  );
}

/**
 * Click a tab, or focus the row and use ←/→ (Audit is disabled and skipped). The row
 * is one Tab stop; Tab again moves into the panel.
 */
export const Default: Story = {
  render: () => <InvoiceTabs />,
};

/** `keyboardActivation="manual"`: arrows only move focus; Enter or Space shows the panel. */
export const ManualActivation: Story = {
  render: () => <InvoiceTabs keyboardActivation="manual" />,
};

/** `value` + `onChange`: the parent owns the tab (e.g. to keep it in the URL). */
export const Controlled: Story = {
  render: function Render() {
    const [tab, setTab] = useState('lines');
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-muted">
          Selected: <code>{tab}</code>
        </p>
        <InvoiceTabs value={tab} onChange={setTab} defaultValue={undefined} />
      </div>
    );
  },
};
