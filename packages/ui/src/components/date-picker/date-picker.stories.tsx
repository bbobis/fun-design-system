import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../field';
import { DatePicker, type DatePickerProps } from './date-picker';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Due date',
    defaultValue: '2026-10-04',
    size: 'md',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Click a piece and type, or use ↑↓. Tab moves between pieces. The button (or Alt+↓)
 * opens the calendar: arrows move by day, PageUp/PageDown by month, Enter picks.
 */
export const Playground: Story = {};

/** Controlled, with the value the app receives shown underneath. */
export const InAField: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState<string | null>('2026-10-04');
      return (
        <div className="flex flex-col gap-2">
          <Field
            label="Due date"
            description="When the invoice must be paid."
            required
          >
            <DatePicker value={value} onChange={setValue} />
          </Field>
          <p className="text-sm text-fg-muted">
            Value: <code>{value === null ? 'null' : `'${value}'`}</code>
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

/** Only days between `min` and `max` can be picked; the rest are greyed out. */
export const MinMax: Story = {
  args: { min: '2026-10-05', max: '2026-10-24', defaultValue: '2026-10-10' },
};

export const WithError: Story = {
  render: () => (
    <Field label="Due date" error="Due date can't be before the issue date.">
      <DatePicker defaultValue="2026-09-01" />
    </Field>
  ),
};

export const Sizes: Story = {
  render: (args: DatePickerProps) => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <DatePicker
          key={size}
          {...args}
          size={size}
          aria-label={`Due date ${size}`}
        />
      ))}
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };

/**
 * `showToday`: a "Today" button under the calendar picks today and closes. It's
 * disabled when today is outside `min` / `max`. Open the calendar to see it.
 */
export const WithToday: Story = { args: { showToday: true } };

/**
 * The calendar opens at the field's size: open each one. `sm` has 32px days (dense
 * forms, filters), `md` 36px, `lg` 40px (touch, big forms).
 */
export const CalendarSizes: Story = {
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  render: (args: DatePickerProps) => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <DatePicker
          key={size}
          {...args}
          size={size}
          aria-label={`Due date ${size}`}
          showToday
        />
      ))}
    </div>
  ),
};
