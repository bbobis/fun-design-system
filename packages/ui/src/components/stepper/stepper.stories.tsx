import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
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
