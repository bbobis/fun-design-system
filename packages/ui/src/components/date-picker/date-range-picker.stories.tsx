import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Field } from '../field';
import { DateRangePicker } from './date-range-picker';
import type { IsoDateRange } from './iso-date';

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Report period',
    defaultValue: { start: '2026-10-05', end: '2026-10-16' },
    size: 'md',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Type both dates (Tab moves through the pieces), or open the calendar with the button
 * (or Alt+↓): click the first day, then the last. Between the clicks, the band follows
 * the mouse (or the arrow keys) to preview the range.
 */
export const Playground: Story = {};

/** Controlled, with the value the app receives shown underneath. */
export const InAField: Story = {
  render: () => {
    function Example() {
      const [value, setValue] = useState<IsoDateRange | null>({
        start: '2026-10-01',
        end: '2026-10-31',
      });
      return (
        <div className="flex flex-col gap-2">
          <Field
            label="Report period"
            description="Both days are included."
            required
          >
            <DateRangePicker value={value} onChange={setValue} />
          </Field>
          <p className="text-sm text-fg-muted">
            Value:{' '}
            <code>
              {value === null
                ? 'null'
                : `{ start: '${value.start}', end: '${value.end}' }`}
            </code>
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

/**
 * Only days between `min` and `max` can be picked. Type a day outside them (or an end
 * before the start) and the field turns red.
 */
export const MinMax: Story = {
  args: {
    min: '2026-10-05',
    max: '2026-10-24',
    defaultValue: { start: '2026-10-08', end: '2026-10-14' },
  },
};

export const WithError: Story = {
  render: () => (
    <Field label="Report period" error="Pick 31 days or fewer.">
      <DateRangePicker
        defaultValue={{ start: '2026-08-01', end: '2026-10-15' }}
      />
    </Field>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
