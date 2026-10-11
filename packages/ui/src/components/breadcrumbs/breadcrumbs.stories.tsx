import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from './breadcrumbs';

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'Invoices', href: '#' },
      { label: 'INV-2041' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The last item is the current page: plain text, `aria-current="page"`. */
export const Default: Story = {};

/** Deep trails wrap onto the next line instead of overflowing. */
export const Deep: Story = {
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'Customers', href: '#' },
      { label: 'Acme Ltd', href: '#' },
      { label: 'Invoices', href: '#' },
      { label: '2026', href: '#' },
      { label: 'INV-2041', href: '#' },
      { label: 'Edit line 3' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-80">
        <Story />
      </div>
    ),
  ],
};
