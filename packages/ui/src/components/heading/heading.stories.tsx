import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './heading';

const meta = {
  title: 'Components/Heading',
  component: Heading,
  tags: ['autodocs'],
  args: { level: 2, children: 'Outstanding invoices' },
  argTypes: {
    level: { control: 'radio', options: [1, 2, 3, 4, 5, 6] },
    size: {
      control: 'radio',
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl'],
    },
  },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Default size for each level. */
export const Levels: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {([1, 2, 3, 4, 5, 6] as const).map((level) => (
        <Heading key={level} level={level}>
          h{level} · Outstanding invoices
        </Heading>
      ))}
    </div>
  ),
};

/** Level is structure, size is looks. Both of these are h2. */
export const LevelVsSize: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={2} size="2xl">
        h2, sized 2xl (a hero title under an existing h1)
      </Heading>
      <Heading level={2} size="sm">
        h2, sized sm (a compact section title)
      </Heading>
    </div>
  ),
};

/** Display sizes for a hero or a landing page: `3xl` and `4xl`, tightly spaced. */
export const Display: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={1} size="4xl">
        Get paid on time
      </Heading>
      <Heading level={2} size="3xl" weight="medium">
        Invoices that chase themselves
      </Heading>
    </div>
  ),
};

/**
 * `eyebrow`: a small line above the title. It sits next to the `<h2>`, not inside it
 * (both in an `<hgroup>`), so the heading's name stays "Invoices".
 */
export const Eyebrow: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Heading level={2} eyebrow="Billing">
        Invoices
      </Heading>
      <Heading level={2} size="3xl" eyebrow="New in November">
        Automatic payment reminders
      </Heading>
    </div>
  ),
};

/** `weight`, `tone` and `truncate`. */
export const WeightToneTruncate: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3">
      <Heading level={3} weight="medium">
        Medium weight
      </Heading>
      <Heading level={3} weight="bold">
        Bold weight
      </Heading>
      <Heading level={3} tone="muted">
        Muted tone
      </Heading>
      <div className="rounded-md bg-primary p-3 text-on-primary">
        <Heading level={3} tone="inherit">
          Inherits the panel's color
        </Heading>
      </div>
      <Heading level={3} truncate>
        A very long card title that would otherwise wrap onto several lines
      </Heading>
    </div>
  ),
};
