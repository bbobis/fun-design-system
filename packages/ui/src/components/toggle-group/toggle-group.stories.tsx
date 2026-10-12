import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { Toolbar, ToolbarSeparator } from '../toolbar';
import { ToggleGroup, type ToggleOption } from './toggle-group';

const meta = {
  title: 'Components/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Toggles', options: [] },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

const Letter = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => (
  <span className={`text-sm leading-none ${className ?? ''}`}>{children}</span>
);
const textStyles: ToggleOption[] = [
  { id: 'bold', label: 'Bold', icon: <Letter className="font-bold">B</Letter> },
  {
    id: 'italic',
    label: 'Italic',
    icon: <Letter className="italic">I</Letter>,
  },
  {
    id: 'underline',
    label: 'Underline',
    icon: <Letter className="underline">U</Letter>,
  },
  {
    id: 'strike',
    label: 'Strikethrough',
    icon: <Letter className="line-through">S</Letter>,
  },
];

/** Icon-only text styles. Tab in, ←/→ to move, Space to toggle; hover for the name. */
export const TextStyle: Story = {
  render: function Render() {
    const [on, setOn] = useState<string[]>(['bold']);
    return (
      <div className="flex flex-col items-start gap-2">
        <ToggleGroup
          aria-label="Text style"
          iconOnly
          options={textStyles}
          value={on}
          onChange={setOn}
        />
        <p className="text-sm text-fg-muted">
          On: <code>{JSON.stringify(on)}</code>
        </p>
      </div>
    );
  },
};

/** With text: which statuses to show. Any number, including none. */
export const Filters: Story = {
  args: {
    'aria-label': 'Show',
    options: [
      { id: 'draft', label: 'Draft' },
      { id: 'sent', label: 'Sent' },
      { id: 'paid', label: 'Paid' },
      { id: 'overdue', label: 'Overdue' },
    ],
    defaultValue: ['sent', 'overdue'],
  },
};

/**
 * Inside a Toolbar: still one Tab stop for the whole toolbar; ←/→ run through the
 * buttons and the toggles alike.
 */
export const InToolbar: Story = {
  render: () => (
    <Toolbar aria-label="Editor">
      <Button size="sm" intent="ghost">
        Undo
      </Button>
      <Button size="sm" intent="ghost">
        Redo
      </Button>
      <ToolbarSeparator />
      <ToggleGroup
        aria-label="Text style"
        iconOnly
        size="sm"
        options={textStyles}
        defaultValue={['italic']}
      />
      <ToolbarSeparator />
      <Button size="sm" intent="secondary">
        Insert link
      </Button>
    </Toolbar>
  ),
};
