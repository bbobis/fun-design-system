import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Stepper, type StepperStep } from '../stepper';
import { Pagination, type PaginationProps } from './pagination';

function Paged(props: Partial<PaginationProps>) {
  const [page, setPage] = useState(3);
  return (
    <Pagination page={page} pageCount={12} onChange={setPage} {...props} />
  );
}
const btn = (name: string) => screen.getByRole('button', { name });
const status = () =>
  document.querySelector('[data-page-status]') as HTMLElement | null;

describe('Pagination styles', () => {
  it('full by default: page buttons, no live status, no edge buttons', () => {
    render(<Paged />);
    expect(btn('Page 3').getAttribute('aria-current')).toBe('page');
    expect(status()).toBeNull();
    expect(screen.queryByRole('button', { name: 'First page' })).toBeNull();
  });

  it('simple: no page buttons; "Page 3 of 12" is a polite live region that updates', () => {
    render(<Paged variant="simple" />);
    expect(screen.queryByRole('button', { name: 'Page 3' })).toBeNull();
    expect(status()?.getAttribute('aria-live')).toBe('polite');
    expect(status()?.textContent).toBe('Page 3 of 12');
    act(() => {
      fireEvent.click(btn('Next'));
    });
    expect(status()?.textContent).toBe('Page 4 of 12');
  });

  it('compact: icon-only arrows with names; screen readers get words, not "3 / 12"', () => {
    render(<Paged variant="compact" />);
    expect(btn('Previous page')).toBeTruthy();
    expect(btn('Next page')).toBeTruthy();
    const visual = status()?.querySelector('[aria-hidden="true"]');
    expect(visual?.textContent).toBe('3 / 12');
    expect(status()?.querySelector('.sr-only')?.textContent).toBe(
      'Page 3 of 12',
    );
  });

  it('showEdges: First and Last, aria-disabled at the ends (still focusable)', () => {
    render(<Paged showEdges />);
    act(() => {
      fireEvent.click(btn('First page'));
    });
    expect(btn('Page 1').getAttribute('aria-current')).toBe('page');
    expect(btn('First page').getAttribute('aria-disabled')).toBe('true');
    expect(btn('First page').hasAttribute('disabled')).toBe(false);
    act(() => {
      fireEvent.click(btn('Last page'));
    });
    expect(btn('Page 12').getAttribute('aria-current')).toBe('page');
  });

  it('size="md" uses medium buttons', () => {
    render(<Paged size="md" />);
    expect(btn('Page 3').className).toContain('h-10');
  });
});

const steps: StepperStep[] = [
  { id: 'a', label: 'Details', icon: <svg data-testid="icon-a" /> },
  { id: 'b', label: 'Billing', icon: <svg data-testid="icon-b" /> },
  { id: 'c', label: 'Review' },
];

describe('Stepper styles', () => {
  it('icons replace the number; done steps still show the ✓', () => {
    render(<Stepper steps={steps} current="b" />);
    // Step a is done: ✓, not its icon. Step b is current: its icon.
    expect(screen.queryByTestId('icon-a')).toBeNull();
    expect(screen.getByTestId('icon-b')).toBeTruthy();
    // Step c has no icon: its number.
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('dots: no numbers, same list, labels and status words', () => {
    render(<Stepper steps={steps} current="b" variant="dots" />);
    expect(document.querySelectorAll('[data-marker="dot"]')).toHaveLength(3);
    expect(screen.queryByText('3')).toBeNull();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1].getAttribute('aria-current')).toBe('step');
    expect(items[0].textContent).toContain(', completed');
    expect(items[2].textContent).toContain(', not started');
  });

  it('size="sm": smaller markers and text', () => {
    render(<Stepper steps={steps} current="b" size="sm" />);
    const marker = document.querySelector('[data-marker="circle"]');
    expect(marker?.className).toContain('size-5');
    expect(screen.getByText('Review').className).toContain('text-xs');
  });
});
