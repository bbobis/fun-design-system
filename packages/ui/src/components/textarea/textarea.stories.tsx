import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from '../field';
import { TextArea } from './textarea';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type several lines: the box grows (up to 12 lines, in browsers with field-sizing). */
export const Default: Story = {
  render: () => (
    <Field label="Notes" description="Visible to your team only.">
      <TextArea placeholder="Anything the next person should know?" />
    </Field>
  ),
};

/** With a limit and a counter; the counter turns red at the limit. */
export const WithCount: Story = {
  render: () => (
    <Field label="Reason for credit" required>
      <TextArea maxLength={200} showCount />
    </Field>
  ),
};

export const Invalid: Story = {
  render: () => (
    <Field
      label="Reason for credit"
      error="Add a reason (at least 10 characters)."
    >
      <TextArea defaultValue="Late" />
    </Field>
  ),
};
