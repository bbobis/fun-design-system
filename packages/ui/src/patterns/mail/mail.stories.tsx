import type { Meta, StoryObj } from '@storybook/react-vite';
import { MailPage } from './mail-page';

const meta = {
  title: 'Patterns/Mail',
  component: MailPage,
  // The page fills the screen, like AppShell's stories.
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div className="-m-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A mail app made only from library parts. Try it with the keyboard:
 * - Tab to the list; ↑/↓ move, Space ticks, Enter opens (and marks read).
 * - Tab back to the toolbar: the checkbox ticks the whole page; "Select by ▾" picks
 *   read or unread; Mark as read / unread act on the ticks and say so in the status
 *   line under the page.
 * - Search and "Unread only" filter the list; the arrows page through it.
 * - Folders in the sidebar switch the list. Narrow the window: the reading pane
 *   replaces the list, with a Back button.
 */
export const Inbox: Story = {};
