import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Breadcrumbs } from '../breadcrumbs';
import { Link, RouterProvider } from './link';

const meta = {
  title: 'Components/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { href: '#invoices', children: 'Invoices' },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * `inline` (default): inside a sentence, always underlined. The underline, not the
 * color, is what tells people it's a link.
 */
export const Inline: Story = {
  render: () => (
    <p className="max-w-prose text-sm text-fg">
      Invoices are due 30 days after issue. You can change the terms in{' '}
      <Link href="#settings">billing settings</Link>, or read{' '}
      <Link href="#late-fees">how late fees work</Link> before you do.
    </p>
  ),
};

/** `standalone`: on its own line. No underline until hover; medium weight instead. */
export const Standalone: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3 text-sm">
      <Link href="#all" variant="standalone">
        View all invoices <span aria-hidden="true">→</span>
      </Link>
      <Link href="#export" variant="standalone">
        Export history
      </Link>
    </div>
  ),
};

/**
 * `external`: new tab, ↗ icon, and ", opens in a new tab" read by screen readers (it's
 * part of the link's name, visually hidden).
 */
export const External: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3 text-sm">
      <p className="text-fg">
        Read the{' '}
        <Link href="https://www.w3.org/WAI/" external>
          WAI guidelines
        </Link>{' '}
        for more.
      </p>
      <Link href="https://www.w3.org/WAI/" external variant="standalone">
        Accessibility resources
      </Link>
    </div>
  ),
};

/**
 * `RouterProvider` once around the app: app paths go to your router instead of loading
 * a new page. Here a fake router just shows the path. Breadcrumbs use it too.
 * Ctrl/⌘-click still opens a real new tab.
 */
export const WithRouter: Story = {
  render: () => {
    function Example() {
      const [path, setPath] = useState('/invoices');
      return (
        <RouterProvider navigate={setPath}>
          <div className="flex flex-col items-start gap-4 text-sm">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Invoices', href: '/invoices' },
                { label: 'INV-2041' },
              ]}
            />
            <p className="text-fg">
              Open <Link href="/invoices/2041">INV-2041</Link> or{' '}
              <Link href="/customers/acme">Acme Ltd.</Link>
            </p>
            <p role="status" className="text-fg-muted">
              Router path: <code>{path}</code>
            </p>
          </div>
        </RouterProvider>
      );
    }
    return <Example />;
  },
};
