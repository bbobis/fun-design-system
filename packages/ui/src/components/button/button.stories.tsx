import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Save changes',
    intent: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
  },
  argTypes: {
    intent: {
      control: 'radio',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    shape: { control: 'radio', options: ['default', 'pill'] },
    fullWidth: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Use the controls panel to try every combination. */
export const Playground: Story = {};

/** One primary per screen. Danger only for destructive actions. */
export const Intents: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} intent="primary">
        Primary
      </Button>
      <Button {...args} intent="secondary">
        Secondary
      </Button>
      <Button {...args} intent="outline">
        Outline
      </Button>
      <Button {...args} intent="ghost">
        Ghost
      </Button>
      <Button {...args} intent="danger">
        Danger
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

/** Disabled drops out of the tab order. Loading stays focusable and announces busy. */
export const States: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>Enabled</Button>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} loading>
        Saving
      </Button>
    </div>
  ),
};

/** Tab to a button to see the focus ring. Clicking with a mouse does not show it. */
export const KeyboardFocus: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-fg-muted">Press Tab, then Enter or Space.</p>
      <div className="flex gap-3">
        <Button {...args}>First</Button>
        <Button {...args} intent="secondary">
          Second
        </Button>
      </div>
    </div>
  ),
};

const PlusIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    className="size-full"
  >
    <path d="M8 3v10M3 8h10" />
  </svg>
);
const ArrowIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-full rtl:-scale-x-100"
  >
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
const TrashIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-full"
  >
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.5 8.5h6l.5-8.5" />
  </svg>
);
const DownloadIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-full"
  >
    <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
  </svg>
);

/**
 * `startIcon` / `endIcon`: decoration, sized to the button. While `loading`, the
 * spinner takes the start icon's place, so the label doesn't jump.
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button startIcon={<PlusIcon />}>New invoice</Button>
      <Button intent="outline" startIcon={<DownloadIcon />}>
        Export
      </Button>
      <Button intent="secondary" endIcon={<ArrowIcon />}>
        Next
      </Button>
      <Button loading startIcon={<PlusIcon />}>
        New invoice
      </Button>
      <Button size="lg" startIcon={<PlusIcon />}>
        Large
      </Button>
    </div>
  ),
};

/**
 * `shape`: `default`, `pill`, and `square` (icon only). A square Button must have an
 * `aria-label` (TypeScript enforces it): it's the only name a screen reader hears.
 */
export const Shapes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button>Default</Button>
        <Button shape="pill">Pill</Button>
        <Button shape="pill" intent="outline" startIcon={<PlusIcon />}>
          Add filter
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {(['sm', 'md', 'lg'] as const).map((size) => (
          <Button
            key={size}
            shape="square"
            size={size}
            intent="outline"
            aria-label={`Delete (${size})`}
            startIcon={<TrashIcon />}
          />
        ))}
        <Button
          shape="square"
          intent="ghost"
          aria-label="Download"
          startIcon={<DownloadIcon />}
        />
        <Button
          shape="square"
          intent="danger"
          aria-label="Delete invoice"
          startIcon={<TrashIcon />}
        />
      </div>
    </div>
  ),
};

/** `fullWidth`: stretches to its container. Common in mobile forms and dialog footers. */
export const FullWidth: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Button fullWidth>Continue</Button>
      <Button fullWidth intent="outline">
        Back
      </Button>
    </div>
  ),
};
