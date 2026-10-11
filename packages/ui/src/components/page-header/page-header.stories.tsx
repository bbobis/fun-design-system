import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from '../breadcrumbs';
import { Button } from '../button';
import { PageHeader } from './page-header';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { title: 'Invoices' },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Everything: breadcrumbs, title, description, actions. */
export const Full: Story = {
  args: {
    breadcrumbs: (
      <Breadcrumbs
        items={[{ label: 'Billing', href: '#' }, { label: 'Invoices' }]}
      />
    ),
    description: 'All invoices sent in the last 12 months.',
    actions: (
      <>
        <Button intent="secondary">Export</Button>
        <Button>New invoice</Button>
      </>
    ),
  },
};

/** Only the title is required. */
export const TitleOnly: Story = {};
