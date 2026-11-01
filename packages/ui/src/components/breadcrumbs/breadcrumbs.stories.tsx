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

/**
 * `maxItems={3}`: the middle levels move into a "…" menu. Tab to it and press Enter:
 * each hidden level is a link in the menu.
 */
export const Collapsed: Story = {
  args: { ...Deep.args, maxItems: 3 },
};

const HomeIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinejoin="round"
    className="size-full"
  >
    <path d="M2.5 7 8 2.5 13.5 7v6.5h-3.5V10h-4v3.5H2.5z" />
  </svg>
);
const FolderIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinejoin="round"
    className="size-full"
  >
    <path d="M2 4.5h4l1.5 1.5H14v6.5H2z" />
  </svg>
);

const trail = [
  { label: 'Home', href: '#' },
  { label: 'Invoices', href: '#' },
  { label: 'INV-2041' },
];

/** `separator`: chevron (default), slash or arrow. All are decoration only. */
export const Separators: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Breadcrumbs items={trail} separator="chevron" aria-label="Chevron" />
      <Breadcrumbs items={trail} separator="slash" aria-label="Slash" />
      <Breadcrumbs items={trail} separator="arrow" aria-label="Arrow" />
    </div>
  ),
};

/** `variant="contained"`: the trail in a soft rounded bar, e.g. under a page title. */
export const Contained: Story = {
  args: { items: trail, variant: 'contained' },
};

/**
 * `variant="steps"`: arrow-shaped segments, the current page filled. The shapes are
 * painted behind the links, so the focus ring (Tab) is never clipped. Long trails still
 * collapse into "…".
 */
export const Steps: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Breadcrumbs items={trail} variant="steps" aria-label="Steps" />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '#' },
          { label: 'Customers', href: '#' },
          { label: 'Acme Ltd', href: '#' },
          { label: 'Invoices', href: '#' },
          { label: 'INV-2041' },
        ]}
        variant="steps"
        maxItems={3}
        aria-label="Steps, collapsed"
      />
    </div>
  ),
};

/**
 * `icon` on an item, and `iconOnly` for a house-only "Home". Screen readers still hear
 * "Home": the label is hidden on screen, not removed.
 */
export const Icons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Breadcrumbs
        aria-label="Icons"
        items={[
          { label: 'Home', href: '#', icon: <HomeIcon />, iconOnly: true },
          { label: 'Invoices', href: '#', icon: <FolderIcon /> },
          { label: 'INV-2041' },
        ]}
      />
      <Breadcrumbs
        aria-label="Icons, contained"
        variant="contained"
        separator="slash"
        items={[
          { label: 'Home', href: '#', icon: <HomeIcon />, iconOnly: true },
          { label: 'Invoices', href: '#', icon: <FolderIcon /> },
          { label: 'INV-2041' },
        ]}
      />
    </div>
  ),
};

/** `size`: sm for dense screens (inside cards, tables), md (default) for page headers. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['sm', 'md'] as const).map((size) =>
        (['plain', 'contained', 'steps'] as const).map((variant) => (
          <Breadcrumbs
            key={size + variant}
            aria-label={`${variant} ${size}`}
            items={trail}
            size={size}
            variant={variant}
          />
        )),
      )}
    </div>
  ),
};
