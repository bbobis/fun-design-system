import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SVGProps } from 'react';
import { Badge } from '../badge';
import { Breadcrumbs } from '../breadcrumbs';
import { Button } from '../button';
import { PageHeader } from '../page-header';
import { AppShell } from './app-shell';
import { SideNav, SideNavItem, SideNavSection } from './side-nav';

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  // The shell fills the screen, so no padding and no centring.
  parameters: { layout: 'fullscreen' },
  args: { brand: null, sidebar: null, children: null },
  decorators: [
    (Story) => (
      <div className="-m-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof meta>;

function MainNav() {
  return (
    <SideNav aria-label="Main">
      <SideNavSection>
        <SideNavItem href="#" icon={<HomeIcon />}>
          Dashboard
        </SideNavItem>
      </SideNavSection>
      <SideNavSection title="Billing">
        <SideNavItem
          href="#"
          icon={<DocIcon />}
          current
          end={<Badge tone="info">3</Badge>}
        >
          Invoices
        </SideNavItem>
        <SideNavItem href="#" icon={<CardIcon />}>
          Payments
        </SideNavItem>
        <SideNavItem href="#" icon={<UsersIcon />}>
          Customers
        </SideNavItem>
      </SideNavSection>
      <SideNavSection title="Settings">
        <SideNavItem href="#" icon={<GearIcon />}>
          Organization
        </SideNavItem>
      </SideNavSection>
    </SideNav>
  );
}

/**
 * Press Tab once: the skip link appears; Enter jumps past the sidebar into the page.
 * Make the window narrower than 1024px: the sidebar moves into a ☰ drawer.
 */
export const Default: Story = {
  render: () => (
    <AppShell
      brand={
        <a href="#" className="rounded px-1 text-base">
          Acme Billing
        </a>
      }
      actions={
        <>
          <Button intent="ghost" size="sm">
            Help
          </Button>
          <Button intent="secondary" size="sm">
            Ben B.
          </Button>
        </>
      }
      sidebar={<MainNav />}
    >
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[{ label: 'Billing', href: '#' }, { label: 'Invoices' }]}
          />
        }
        title="Invoices"
        description="All invoices sent in the last 12 months."
        actions={
          <>
            <Button intent="secondary">Export</Button>
            <Button>New invoice</Button>
          </>
        }
      />
      <div className="grid gap-3">
        {[
          'INV-2041 · Acme Ltd · $1,200.00',
          'INV-2040 · Globex · $86.50',
          'INV-2039 · Initech · $4,310.00',
        ].map((row) => (
          <div
            key={row}
            className="rounded-md border border-border px-4 py-3 text-sm"
          >
            {row}
          </div>
        ))}
      </div>
    </AppShell>
  ),
};

function Icon({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}
const HomeIcon = () => <Icon d="M2.5 7 8 2.5 13.5 7v6.5h-4v-4h-3v4h-4z" />;
const DocIcon = () => (
  <Icon d="M4 1.5h5.5l3 3v10H4zM9.5 1.5v3h3M6 8h5M6 11h5" />
);
const CardIcon = () => <Icon d="M1.5 3.5h13v9h-13zM1.5 6.5h13M4 10h3" />;
const UsersIcon = () => (
  <Icon d="M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 2.2a2.5 2.5 0 0 1 0 4.6M12.5 10.2c1.3.6 2 1.9 2 3.8" />
);
const GearIcon = () => (
  <Icon d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
);
