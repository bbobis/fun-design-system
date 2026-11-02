import type { Meta, StoryObj } from '@storybook/react-vite';
import { parseDate, getDayOfWeek } from '@internationalized/date';
import { useState } from 'react';
import { Text } from '../text';
import type { IsoDateRange } from '../date-picker';
import { Calendar, RangeCalendar } from './calendar';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Delivery date',
    defaultValue: '2026-11-14',
    size: 'md',
    variant: 'card',
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'radio', options: ['plain', 'card'] },
    firstDayOfWeek: {
      control: 'select',
      options: [undefined, 'sun', 'mon', 'sat'],
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Tab into the grid, then: arrows move by day, PageUp / PageDown by month (Shift: by
 * year), Home / End to the ends of the week, Enter or Space picks.
 */
export const Playground: Story = {};

const holidays = ['2026-11-11', '2026-12-25', '2026-12-26'];
/** Weekends and holidays: you can look at them, not book them. */
const closed = (iso: string) => {
  // 0 = the first day of the week in en-US (Sunday), 6 = Saturday.
  const weekday = getDayOfWeek(parseDate(iso), 'en-US');
  return weekday === 0 || weekday === 6 || holidays.includes(iso);
};

/**
 * A booking sidebar: `min` is "today" (earlier days are disabled: not focusable),
 * weekends and holidays are `unavailable` (struck through: you can arrow onto them,
 * but not pick them). The week starts on Monday.
 */
export const DeliveryDay: Story = {
  render: function Render() {
    const [day, setDay] = useState<string | null>('2026-11-04');
    return (
      <div className="flex items-start gap-6">
        <Calendar
          aria-label="Delivery date"
          value={day}
          onChange={setDay}
          min="2026-11-02"
          unavailable={closed}
          firstDayOfWeek="mon"
          variant="card"
        />
        <Text size="sm" tone="muted">
          Delivery on <span className="font-medium text-fg">{day}</span>
        </Text>
      </div>
    );
  },
};

/**
 * `RangeCalendar` with `visibleMonths={2}`: a hotel stay across a month end. First
 * click sets check-in, second sets check-out. Under 40rem wide it shows one month.
 */
export const StayRange: Story = {
  render: function Render() {
    const [stay, setStay] = useState<IsoDateRange | null>({
      start: '2026-11-27',
      end: '2026-12-03',
    });
    return (
      <div className="flex flex-col items-start gap-2">
        <RangeCalendar
          aria-label="Stay"
          value={stay}
          onChange={setStay}
          min="2026-11-02"
          visibleMonths={2}
          variant="card"
        />
        <Text size="sm" tone="muted">
          {stay ? `${stay.start} → ${stay.end}` : 'No dates yet'}
        </Text>
      </div>
    );
  },
};

/** `size`: sm for sidebars, lg for touch and booking pages. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Calendar
          key={size}
          {...args}
          size={size}
          aria-label={`Delivery date ${size}`}
        />
      ))}
    </div>
  ),
};

/** `variant="plain"`: no box, for a sidebar that already has one. */
export const Plain: Story = { args: { variant: 'plain' } };
