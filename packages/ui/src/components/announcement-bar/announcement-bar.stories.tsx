import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button';
import { AppShell, SideNav, SideNavItem, SideNavSection } from '../app-shell';
import { Link } from '../link';
import { PageHeader } from '../page-header';
import { AnnouncementBar } from './announcement-bar';

const meta = {
  title: 'Layout/AnnouncementBar',
  component: AnnouncementBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    tone: 'info',
    children: 'Invoices now support recurring schedules.',
    action: <Link href="#learn">Learn more</Link>,
  },
  argTypes: {
    tone: {
      control: 'radio',
      options: ['neutral', 'info', 'warning', 'danger', 'inverse'],
    },
  },
} satisfies Meta<typeof AnnouncementBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * In AppShell's `announcement` slot, above the top bar. Tab: skip link, then the
 * status link and the ×. Dismiss it: focus moves on to the ☰ / brand link instead
 * of getting lost, and a reload doesn't bring it back (`dismissKey`). Clear it with
 * `localStorage.removeItem('fds:announcement-dismissed:maintenance-2026-11-08')`.
 */
export const InAppShell: Story = {
  render: () => (
    <AppShell
      announcement={
        <AnnouncementBar
          tone="warning"
          dismissKey="maintenance-2026-11-08"
          action={<Link href="#status">Status page</Link>}
        >
          Scheduled maintenance Sunday, Nov 8, 2–4 AM ET. Invoices can’t be sent
          during that time.
        </AnnouncementBar>
      }
      brand={
        <a href="#home" className="rounded px-1 text-base font-semibold">
          Acme Billing
        </a>
      }
      sidebar={
        <SideNav aria-label="Main">
          <SideNavSection>
            <SideNavItem href="#home">Home</SideNavItem>
            <SideNavItem href="#invoices" current>
              Invoices
            </SideNavItem>
          </SideNavSection>
        </SideNav>
      }
    >
      <PageHeader title="Invoices" actions={<Button>New invoice</Button>} />
    </AppShell>
  ),
};

/**
 * Every `tone`. `inverse` is a dark bar in light mode (and light in dark mode), for
 * product news: `data-inverse` flips the theme inside it, so the Button re-themes too.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <AnnouncementBar tone="neutral" onDismiss={() => undefined}>
        You’re viewing the Acme Corp workspace.
      </AnnouncementBar>
      <AnnouncementBar
        tone="info"
        action={<Link href="#learn">Learn more</Link>}
      >
        Invoices now support recurring schedules.
      </AnnouncementBar>
      <AnnouncementBar
        tone="warning"
        action={<Link href="#billing">Add a card</Link>}
      >
        Your trial ends in 3 days.
      </AnnouncementBar>
      <AnnouncementBar
        tone="danger"
        action={<Link href="#status">Status page</Link>}
      >
        Payments are delayed: our card processor is having an outage.
      </AnnouncementBar>
      <AnnouncementBar
        tone="inverse"
        onDismiss={() => undefined}
        action={
          <Button size="sm" intent="secondary">
            Try it
          </Button>
        }
      >
        New: send invoices by WhatsApp.
      </AnnouncementBar>
    </div>
  ),
};
