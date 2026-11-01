import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
        <Tab id="lines" count={12}>
          Lines
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

/**
 * `variant` on `<Tabs>`: underline (default), pills, enclosed (folder tabs that open
 * into a bordered panel). Every Tab and the panel follow it; keys work the same.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-10">
      <InvoiceTabs variant="underline" />
      <InvoiceTabs variant="pills" />
      <InvoiceTabs variant="enclosed" />
    </div>
  ),
};

/** `size="sm"` for dense places (inside a card or a side panel). */
export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-10">
      <InvoiceTabs size="sm" />
      <InvoiceTabs size="sm" variant="pills" />
      <InvoiceTabs size="sm" variant="enclosed" />
    </div>
  ),
};

/** `fullWidth`: the tabs share the row. Good for 2–4 short tabs on a phone. */
export const FullWidth: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-10">
      {(['underline', 'pills', 'enclosed'] as const).map((variant) => (
        <Tabs key={variant} defaultValue="day" variant={variant} fullWidth>
          <TabList aria-label={`Range (${variant})`}>
            <Tab id="day">Day</Tab>
            <Tab id="week">Week</Tab>
            <Tab id="month">Month</Tab>
          </TabList>
          <TabPanel id="day">Today’s numbers.</TabPanel>
          <TabPanel id="week">This week’s numbers.</TabPanel>
          <TabPanel id="month">This month’s numbers.</TabPanel>
        </Tabs>
      ))}
    </div>
  ),
};

const DocIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="size-full"
  >
    <path
      d="M4 1.5h5.5L12.5 4.5v10h-8.5z M9.5 1.5v3h3"
      strokeLinejoin="round"
    />
  </svg>
);
const ListIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    className="size-full"
  >
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h0M2.5 8h0M2.5 12h0" />
  </svg>
);
const ClockIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    className="size-full"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5V8l2.5 1.5" />
  </svg>
);

/**
 * `icon` and `count` on a Tab. The icon is decoration; the count is a pill on screen and
 * "Lines, 12" for screen readers.
 */
export const IconsAndCounts: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-10">
      {(['underline', 'pills', 'enclosed'] as const).map((variant) => (
        <Tabs key={variant} defaultValue="lines" variant={variant}>
          <TabList aria-label={`Invoice sections (${variant})`}>
            <Tab id="details" icon={<DocIcon />}>
              Details
            </Tab>
            <Tab id="lines" icon={<ListIcon />} count={12}>
              Lines
            </Tab>
            <Tab id="history" icon={<ClockIcon />} count={3}>
              History
            </Tab>
          </TabList>
          <TabPanel id="details">Customer: Acme Ltd</TabPanel>
          <TabPanel id="lines">12 invoice lines.</TabPanel>
          <TabPanel id="history">3 changes.</TabPanel>
        </Tabs>
      ))}
    </div>
  ),
};
