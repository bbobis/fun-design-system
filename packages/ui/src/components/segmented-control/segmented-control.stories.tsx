import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type SVGProps } from 'react';
import { SegmentedControl, type SegmentedOption } from './segmented-control';

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { 'aria-label': 'Period', options: [] },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const periods: SegmentedOption[] = [
  { id: 'day', label: 'Day' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
];

/**
 * Tab in, ←/→ to move, Space or Enter to choose. Arrows only move focus; the value
 * (shown underneath) changes when you choose.
 */
export const Default: Story = {
  render: function Render() {
    const [period, setPeriod] = useState('week');
    return (
      <div className="flex flex-col items-start gap-2">
        <SegmentedControl
          aria-label="Period"
          options={periods}
          value={period}
          onChange={setPeriod}
        />
        <p className="text-sm text-fg-muted">
          Value: <code>{period}</code>
        </p>
      </div>
    );
  },
};

const Svg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    {...props}
  />
);
const ListIcon = () => (
  <Svg>
    <path d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h0M2.5 8h0M2.5 12h0" />
  </Svg>
);
const GridIcon = () => (
  <Svg>
    <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" />
    <rect x="9" y="2.5" width="4.5" height="4.5" rx="1" />
    <rect x="2.5" y="9" width="4.5" height="4.5" rx="1" />
    <rect x="9" y="9" width="4.5" height="4.5" rx="1" />
  </Svg>
);
const BoardIcon = () => (
  <Svg>
    <rect x="2.5" y="2.5" width="3" height="11" rx="1" />
    <rect x="6.5" y="2.5" width="3" height="7" rx="1" />
    <rect x="10.5" y="2.5" width="3" height="9" rx="1" />
  </Svg>
);
const views: SegmentedOption[] = [
  { id: 'list', label: 'List', icon: <ListIcon /> },
  { id: 'grid', label: 'Grid', icon: <GridIcon /> },
  { id: 'board', label: 'Board', icon: <BoardIcon /> },
];

/** An icon before each label. */
export const WithIcons: Story = {
  args: { 'aria-label': 'View', options: views, defaultValue: 'list' },
};

/**
 * `iconOnly`: the label becomes each segment's name and shows as a tooltip on hover
 * or keyboard focus.
 */
export const IconOnly: Story = {
  args: {
    'aria-label': 'View',
    options: views,
    defaultValue: 'grid',
    iconOnly: true,
    size: 'sm',
  },
};

/** One option disabled (←/→ skip it); or the whole control with `disabled`. */
export const DisabledOption: Story = {
  args: {
    'aria-label': 'Period',
    options: periods.map((p) =>
      p.id === 'quarter' ? { ...p, disabled: true } : p,
    ),
    defaultValue: 'day',
  },
};
