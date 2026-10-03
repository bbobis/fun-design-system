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
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
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
