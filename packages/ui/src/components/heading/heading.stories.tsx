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
      options: [undefined, 'xs', 'sm', 'md', 'lg', 'xl', '2xl'],
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
