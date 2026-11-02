import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../button';
import { Tooltip, type TooltipProps } from '../tooltip';
import { ProgressBar, ProgressCircle } from './progress';

const has = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => !el?.classList.contains(c))).toEqual([]);
const lacks = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => el?.classList.contains(c))).toEqual([]);
const fillOf = (bar: HTMLElement) => bar.querySelector('[data-progress-fill]');

describe('ProgressBar styles', () => {
  it('primary fill and md track by default', () => {
    render(<ProgressBar label="Import" value={40} />);
    const bar = screen.getByRole('progressbar', { name: 'Import' });
    has(fillOf(bar), 'bg-primary');
    has(fillOf(bar)?.parentElement, 'h-2');
  });

  it('tone and size change the fill color and the track height', () => {
    render(<ProgressBar label="Upload" value={70} tone="danger" size="sm" />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    has(fillOf(bar), 'bg-danger');
    lacks(fillOf(bar), 'bg-primary');
    has(fillOf(bar)?.parentElement, 'h-1');
  });

  it('valuePosition="end" puts the value beside the bar, not on the label row', () => {
    render(<ProgressBar label="Upload" value={64} valuePosition="end" />);
    const value = screen.getByText('64%');
    const track = fillOf(screen.getByRole('progressbar'))?.parentElement;
    expect(value.parentElement).toBe(track?.parentElement);
    expect(screen.getByText('Upload').parentElement).not.toBe(
      value.parentElement,
    );
  });
});

describe('ProgressCircle', () => {
  it('is a progressbar like the bar: named, with value and value text', () => {
    render(<ProgressCircle label="Syncing" value={45} showValue />);
    const ring = screen.getByRole('progressbar', { name: 'Syncing' });
    expect(ring.getAttribute('aria-valuenow')).toBe('45');
    expect(ring.getAttribute('aria-valuetext')).toBe('45%');
    // The drawing and the middle text are visual only.
    expect(ring.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByText('45%').getAttribute('aria-hidden')).toBe('true');
  });

  it('valueLabel replaces what screen readers hear', () => {
    render(
      <ProgressCircle label="Upload" value={25} valueLabel="3 of 12 files" />,
    );
    expect(screen.getByRole('progressbar').getAttribute('aria-valuetext')).toBe(
      '3 of 12 files',
    );
  });

  it('no value: indeterminate (no aria-valuenow), spinning', () => {
    render(<ProgressCircle label="Loading" />);
    const ring = screen.getByRole('progressbar', { name: 'Loading' });
    expect(ring.hasAttribute('aria-valuenow')).toBe(false);
    has(ring.querySelector('svg'), 'animate-spin');
  });

  it('tone colors the ring; sm never shows the middle text', () => {
    render(
      <ProgressCircle
        label="Failed"
        value={70}
        tone="danger"
        size="sm"
        showValue
      />,
    );
    const ring = screen.getByRole('progressbar');
    has(ring.querySelector('[data-progress-fill]'), 'stroke-danger');
    expect(screen.queryByText('70%')).toBeNull();
  });
});

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));
async function showTip(props: Partial<TooltipProps>) {
  render(
    <Tooltip content="Export as CSV" delay={0} {...props}>
      <Button aria-label="Export">⤓</Button>
    </Tooltip>,
  );
  act(() => {
    fireEvent.keyDown(document.body, { key: 'Tab' });
    fireEvent.keyUp(document.body, { key: 'Tab' });
  });
  act(() => screen.getByRole('button', { name: 'Export' }).focus());
  await wait(10);
  return screen.getByRole('tooltip');
}

describe('Tooltip styles', () => {
  it('inverse and sm by default, no arrow', async () => {
    const tip = await showTip({});
    has(tip, 'bg-secondary', 'text-xs');
    expect(tip.querySelector('svg')).toBeNull();
  });

  it('variant="light" and size="md"', async () => {
    const tip = await showTip({ variant: 'light', size: 'md' });
    has(tip, 'bg-bg', 'border', 'text-sm');
    lacks(tip, 'bg-secondary', 'text-xs');
  });

  it('arrow adds a decorative arrow; the description text is unchanged', async () => {
    const tip = await showTip({ arrow: true });
    expect(tip.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(tip.textContent).toBe('Export as CSV');
  });
});
