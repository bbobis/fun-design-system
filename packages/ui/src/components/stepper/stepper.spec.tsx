import { fireEvent, render, screen, within } from '@testing-library/react';
import { Stepper, type StepperStep } from './stepper';

const steps: StepperStep[] = [
  { id: 'details', label: 'Details' },
  { id: 'lines', label: 'Line items' },
  { id: 'billing', label: 'Billing', description: 'Tax and terms' },
  { id: 'review', label: 'Review' },
];

describe('Stepper', () => {
  it('is an ordered list named "Progress", one item per step', () => {
    render(<Stepper steps={steps} current="billing" />);
    const list = screen.getByRole('list', { name: 'Progress' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('marks the current step with aria-current="step" and spells out the others', () => {
    render(<Stepper steps={steps} current="billing" />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'step',
      null,
    ]);
    // Words, not just color: what a screen reader reads for each step.
    expect(items.map((li) => li.textContent)).toEqual([
      'Details, completed',
      'Line items, completed',
      '3Billing',
      '4Review, not started',
    ]);
  });

  it('the step number and ✓ are hidden from screen readers (the list says "3 of 4")', () => {
    render(<Stepper steps={steps} current="billing" />);
    const marker = screen.getByText('3');
    expect(marker.getAttribute('aria-hidden')).toBe('true');
  });

  it('display only: no buttons', () => {
    render(<Stepper steps={steps} current="billing" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('onStepClick: completed steps become buttons; current and upcoming do not', () => {
    const onStepClick = vi.fn();
    render(
      <Stepper steps={steps} current="billing" onStepClick={onStepClick} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual([
      'Details, completed',
      'Line items, completed',
    ]);
    fireEvent.click(screen.getByRole('button', { name: /Line items/ }));
    expect(onStepClick).toHaveBeenCalledWith('lines');
  });

  it('vertical shows descriptions; horizontal does not', () => {
    const { rerender } = render(<Stepper steps={steps} current="billing" />);
    expect(screen.queryByText('Tax and terms')).toBeNull();
    rerender(
      <Stepper steps={steps} current="billing" orientation="vertical" />,
    );
    expect(screen.getByText('Tax and terms')).toBeTruthy();
  });

  it('aria-label names the list', () => {
    render(
      <Stepper steps={steps} current="details" aria-label="New invoice" />,
    );
    expect(screen.getByRole('list', { name: 'New invoice' })).toBeTruthy();
  });
});
