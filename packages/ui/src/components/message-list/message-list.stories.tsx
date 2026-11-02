import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { sampleMessages } from './fixtures/messages';
import {
  MessageList,
  markRead,
  type MessageItem,
  type MessageListProps,
} from './message-list';

const meta = {
  title: 'Components/MessageList',
  component: MessageList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Inbox',
    messages: sampleMessages,
    selected: [],
    onSelectionChange: () => undefined,
  },
} satisfies Meta<typeof MessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Keeps messages, ticks and the open message in state, and shows them below. */
function Stateful(props: Partial<MessageListProps<MessageItem>>) {
  const [messages, setMessages] = useState(sampleMessages);
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string>();
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <MessageList
        aria-label="Inbox"
        messages={messages}
        selected={selected}
        onSelectionChange={setSelected}
        openId={openId}
        onOpen={(id) => {
          setOpenId(id);
          setMessages((ms) => markRead(ms, [id], true));
        }}
        className="rounded-md border border-border"
        {...props}
      />
      <p className="text-sm text-fg-muted">
        Ticked: <code>{selected.join(', ') || 'none'}</code> · Open:{' '}
        <code>{openId ?? 'none'}</code>
      </p>
    </div>
  );
}

/**
 * Tab in, ↑/↓ to move. Enter (or a click) opens a message and marks it read; Space
 * (or its checkbox) ticks it. Once something is ticked, clicks tick too and Enter
 * waits: Escape clears the ticks.
 */
export const Default: Story = { render: () => <Stateful /> };

/** `density="compact"`: one line per message, for long lists. */
export const Compact: Story = {
  render: () => <Stateful density="compact" />,
};

/** No messages: the `emptyState` text. */
export const Empty: Story = {
  render: () => <Stateful messages={[]} emptyState="Nothing in Archive yet" />,
};
