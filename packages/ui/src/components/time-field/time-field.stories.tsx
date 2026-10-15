import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DatePicker } from '../date-picker';
import { Field } from '../field';
import { TimeField, type TimeFieldProps } from './time-field';

const meta = {
  title: 'Components/TimeField',
  component: TimeField,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Start time',
    defaultValue: '14:30',
    size: 'md',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    hourCycle: { control: 'radio', options: [undefined, 12, 24] },
    granularity: { control: 'radio', options: ['minute', 'second'] },
  },
  decorators: [
    (Story) => (
      <div className="w-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TimeField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Click a piece and type, or use ↑↓. Tab or → moves between pieces. In 12-hour
 * languages, type A or P in the last piece. ↑ on the hour at 11 AM gives 12 **AM**:
 * each piece spins on its own, like the browser's time input.
 */
export const Playground: Story = {};

/** Controlled, with the value the app receives shown underneath: always 24-hour text. */
export const InAField: Story = {
  render: (args: TimeFieldProps) => {
    function Example() {
      const [time, setTime] = useState<string | null>('09:00');
      return (
        <>
          <Field label="Opens at" description="Local time at the store.">
            <TimeField
              {...args}
              aria-label={undefined}
              defaultValue={undefined}
              value={time}
              onChange={setTime}
            />
          </Field>
          <p className="mt-3 text-sm text-fg-muted">
            value: <code>{JSON.stringify(time)}</code>
          </p>
        </>
      );
    }
    return <Example />;
  },
};

/** 24-hour display. The value is the same `'14:30'` either way. */
export const TwentyFourHour: Story = { args: { hourCycle: 24 } };

/** Seconds too: the value becomes `'HH:mm:ss'`. */
export const Seconds: Story = {
  args: { granularity: 'second', defaultValue: '08:15:45' },
};

/** Business hours only: 07:30 is outside `min`, so the field is marked invalid. */
export const MinMax: Story = {
  render: (args: TimeFieldProps) => (
    <Field label="Delivery time" description="Between 8:00 AM and 6:00 PM.">
      <TimeField
        {...args}
        aria-label={undefined}
        defaultValue="07:30"
        min="08:00"
        max="18:00"
      />
    </Field>
  ),
};

export const WithError: Story = {
  render: (args: TimeFieldProps) => (
    <Field label="Start time" error="Start time is required.">
      <TimeField {...args} aria-label={undefined} defaultValue={null} />
    </Field>
  ),
};

/**
 * "Date and time" is two fields side by side: they share the same box and pieces, so
 * they line up. Store them as two values (`'2026-10-15'` + `'14:30'`) and combine them
 * on the server, where the time zone is known.
 */
export const DateAndTime: Story = {
  decorators: [
    (Story) => (
      <div className="w-[26rem]">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <fieldset className="flex gap-3">
      <legend className="mb-2 text-sm font-medium">Meeting starts</legend>
      <Field label="Date" className="flex-1">
        <DatePicker defaultValue="2026-10-15" />
      </Field>
      <Field label="Time" className="w-40">
        <TimeField defaultValue="14:30" />
      </Field>
    </fieldset>
  ),
};

export const Sizes: Story = {
  render: (args: TimeFieldProps) => (
    <div className="flex flex-col gap-3">
      <TimeField {...args} size="sm" aria-label="Small" />
      <TimeField {...args} size="md" aria-label="Medium" />
      <TimeField {...args} size="lg" aria-label="Large" />
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
