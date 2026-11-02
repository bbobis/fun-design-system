import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type SVGProps } from 'react';
import { Button } from '../button';
import { Stepper, type StepperStep } from './stepper';

const steps: StepperStep[] = [
  { id: 'details', label: 'Details', description: 'Customer and dates' },
  { id: 'lines', label: 'Line items', description: 'What you charge for' },
  { id: 'billing', label: 'Billing', description: 'Tax and payment terms' },
  { id: 'review', label: 'Review', description: 'Check and send' },
];

const meta = {
  title: 'Components/Stepper',
  component: Stepper,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { steps, current: 'billing' },
  argTypes: {
    current: { control: 'select', options: steps.map((s) => s.id) },
    orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Display only: two steps done, "Billing" current, "Review" to come. */
export const Default: Story = {};

/**
 * `onStepClick`: completed steps are buttons, so you can go back (Tab reaches them).
 * Steps to come never are. Use Back / Next to move through the form.
 */
export const Clickable: Story = {
  render: function Render() {
    const [current, setCurrent] = useState('billing');
    const index = steps.findIndex((s) => s.id === current);
    return (
      <div className="flex flex-col gap-4">
        <Stepper
          steps={steps}
          current={current}
          onStepClick={setCurrent}
          aria-label="New invoice"
        />
        <div className="flex gap-2">
          <Button
            intent="secondary"
            size="sm"
            disabled={index === 0}
            onClick={() => setCurrent(steps[index - 1].id)}
          >
            Back
          </Button>
          <Button
            size="sm"
            disabled={index === steps.length - 1}
            onClick={() => setCurrent(steps[index + 1].id)}
          >
            Next
          </Button>
        </div>
      </div>
    );
  },
};

/** `orientation="vertical"`: a side column, with each step's description. */
export const Vertical: Story = {
  args: { orientation: 'vertical', current: 'lines' },
};

/**
 * On a phone only the current step's label shows; the others are there for screen
 * readers. It follows the *screen* width (below 640px), so shrink the browser (or use
 * the toolbar's viewport menu) to see it.
 */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

/** `size="sm"`: smaller circles and text, for a dialog or a card. */
export const Small: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Stepper steps={steps} current="billing" size="sm" />
      <Stepper steps={steps} current="lines" size="sm" orientation="vertical" />
    </div>
  ),
};

/**
 * `variant="dots"`: small dots, no numbers. The current dot has a ring, so it
 * differs from the done ones by shape, not only color. Screen readers hear the same
 * list, labels and status words as with circles.
 */
export const Dots: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <Stepper steps={steps} current="billing" variant="dots" />
      <Stepper
        steps={steps}
        current="billing"
        variant="dots"
        orientation="vertical"
      />
    </div>
  ),
};

/** Story-only icons (16×16 strokes). Apps bring their own. */
function Svg({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

/** `icon` per step: an icon instead of the number. Done steps still show the ✓. */
export const WithIcons: Story = {
  args: {
    current: 'billing',
    steps: [
      {
        id: 'details',
        label: 'Details',
        icon: (
          <Svg d="M8 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-5 5.5c0-2.5 2.2-4 5-4s5 1.5 5 4" />
        ),
      },
      {
        id: 'lines',
        label: 'Line items',
        icon: <Svg d="M3 4h10M3 8h10M3 12h6" />,
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: <Svg d="M2 4.5h12v7H2zM2 7h12" />,
      },
      {
        id: 'review',
        label: 'Review',
        icon: <Svg d="M14 2 7 9M14 2l-4.5 12-2.5-5-5-2.5z" />,
      },
    ],
  },
};
