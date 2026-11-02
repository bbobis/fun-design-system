import { act, render, screen } from '@testing-library/react';
import { toast, ToastRegion } from '../toast';
import { Alert } from './alert';

const has = (el: Element, ...classes: string[]) =>
  classes.forEach((c) => expect(el.classList.contains(c)).toBe(true));
const lacks = (el: Element, ...classes: string[]) =>
  classes.forEach((c) => expect(el.classList.contains(c)).toBe(false));

describe('Alert styles', () => {
  it('variant="bar": page background, thick start border', () => {
    const { container } = render(<Alert variant="bar" title="Heads up" />);
    const box = container.firstElementChild as HTMLElement;
    has(box, 'border-s-4', 'bg-bg', 'text-fg');
    // Logical (start), not physical (left): it flips in right-to-left pages.
    lacks(box, 'border-l-4');
  });

  it('tone="neutral" says no tone word', () => {
    render(<Alert tone="neutral" title="Version 4.2 is available" />);
    const title = screen.getByText('Version 4.2 is available');
    expect(title.textContent).toBe('Version 4.2 is available');
  });

  it('other tones still say their word', () => {
    render(<Alert tone="warning" title="Rates are old" />);
    expect(
      screen.getByText('Rates are old', { exact: false }).textContent,
    ).toBe('Warning: Rates are old');
  });

  it('icon={false} removes the icon; a custom icon replaces it', () => {
    const { container, rerender } = render(<Alert title="A" icon={false} />);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<Alert title="A" icon={<svg data-testid="mine" />} />);
    expect(screen.getByTestId('mine')).toBeTruthy();
    expect(container.querySelectorAll('svg')).toHaveLength(1);
  });

  it('outline and bar colour the icon; soft lets it follow the text', () => {
    const iconBox = (c: HTMLElement) =>
      c.querySelector('svg')?.parentElement as HTMLElement;
    const bar = render(<Alert variant="bar" title="A" />);
    has(iconBox(bar.container), 'text-(--alert-icon)');
    bar.unmount();
    const soft = render(<Alert variant="soft" title="A" />);
    lacks(iconBox(soft.container), 'text-(--alert-icon)');
  });
});

describe('Toast styles', () => {
  const opened: string[] = [];
  afterEach(() => {
    act(() => opened.splice(0).forEach((k) => toast.dismiss(k)));
  });
  const showOne = () =>
    act(() => {
      opened.push(toast.success('Saved', {}, { timeout: null }));
    });

  it('bottom-end by default: newest nearest the bottom edge', () => {
    render(<ToastRegion />);
    showOne();
    has(screen.getByRole('region'), 'bottom-4', 'end-4', 'flex-col-reverse');
  });

  it.each([
    ['top-start', ['top-4', 'start-4', 'flex-col']],
    ['top-center', ['top-4', 'left-1/2', '-translate-x-1/2', 'flex-col']],
    ['bottom-start', ['bottom-4', 'start-4', 'flex-col-reverse']],
  ] as const)('placement=%s', (placement, classes) => {
    render(<ToastRegion placement={placement} />);
    showOne();
    const region = screen.getByRole('region');
    has(region, ...classes);
    lacks(region, 'end-4');
  });

  it('no icons by default; icons adds the tone icon (decorative)', () => {
    const { rerender } = render(<ToastRegion />);
    showOne();
    const toastEl = () => screen.getByRole('alertdialog');
    // Only the × icon.
    expect(toastEl().querySelectorAll('svg')).toHaveLength(1);
    rerender(<ToastRegion icons />);
    const svgs = toastEl().querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    expect(svgs[0].getAttribute('aria-hidden')).toBe('true');
    // The name is still just the title, with its tone word.
    expect(
      screen.getByRole('alertdialog').getAttribute('aria-labelledby'),
    ).toBeTruthy();
  });
});
