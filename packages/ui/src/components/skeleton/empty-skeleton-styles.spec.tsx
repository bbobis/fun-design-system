import { render, screen } from '@testing-library/react';
import { EmptyState } from '../empty-state';
import { Skeleton, SkeletonMedia, SkeletonText } from './skeleton';

const has = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => !el?.classList.contains(c))).toEqual([]);
const lacks = (el: Element | null | undefined, ...classes: string[]) =>
  expect(classes.filter((c) => el?.classList.contains(c))).toEqual([]);

describe('Skeleton styles', () => {
  it('wave: the gradient band, animated only when motion is OK', () => {
    const { container } = render(<Skeleton animation="wave" />);
    const el = container.firstElementChild as HTMLElement;
    has(el, 'motion-safe:animate-skeleton-wave', 'bg-size-[200%_100%]');
    lacks(el, 'motion-safe:animate-pulse', 'animate-skeleton-wave');
  });

  it('none: no animation at all', () => {
    const { container } = render(<Skeleton animation="none" />);
    expect(container.firstElementChild?.className).not.toContain('animate');
  });

  it('SkeletonText: n lines, the last one shorter, all hidden from screen readers', () => {
    const { container } = render(<SkeletonText lines={4} animation="wave" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.getAttribute('aria-hidden')).toBe('true');
    const lines = root.querySelectorAll(':scope > span');
    expect(lines).toHaveLength(4);
    has(lines[3], 'w-3/5', 'motion-safe:animate-skeleton-wave');
    lacks(lines[0], 'w-3/5');
  });

  it('SkeletonText with one line keeps it full width', () => {
    const { container } = render(<SkeletonText lines={1} />);
    lacks(container.querySelector('[data-skeleton] > span'), 'w-3/5');
  });

  it('SkeletonMedia: a circle (avatar) or square (thumbnail) and two lines', () => {
    const { container, rerender } = render(<SkeletonMedia />);
    const root = () => container.firstElementChild as HTMLElement;
    expect(root().getAttribute('aria-hidden')).toBe('true');
    has(root().firstElementChild, 'rounded-full', 'size-10');
    rerender(<SkeletonMedia media="thumbnail" size="sm" />);
    has(root().firstElementChild, 'rounded-md', 'size-8');
  });
});

describe('EmptyState styles', () => {
  it('defaults: plain, centered, neutral icon circle', () => {
    render(<EmptyState headingLevel={2} title="No invoices" icon={<svg />} />);
    const root = screen.getByRole('heading').parentElement;
    has(root, 'items-center', 'text-center', 'mx-auto');
    lacks(root, 'border-dashed', 'bg-surface');
    has(root?.querySelector('[data-tone]'), 'bg-surface');
  });

  it('tone colors the icon circle; the circle stays hidden from screen readers', () => {
    render(
      <EmptyState
        headingLevel={2}
        title="Couldn't load invoices"
        tone="danger"
        icon={<svg />}
      />,
    );
    const circle = document.querySelector('[data-tone="danger"]');
    has(circle, 'bg-danger-soft');
    expect(circle?.getAttribute('aria-hidden')).toBe('true');
  });

  it('variant, align and size="large"', () => {
    render(
      <EmptyState
        headingLevel={2}
        title="Welcome"
        variant="bordered"
        align="start"
        size="large"
      />,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Welcome' });
    const root = heading.parentElement;
    has(root, 'border-dashed', 'items-start', 'py-20');
    lacks(root, 'items-center', 'mx-auto');
    has(heading, 'text-lg');
  });

  it('card: a neutral circle switches to the page color so it shows on the panel', () => {
    render(
      <EmptyState
        headingLevel={2}
        title="Empty"
        variant="card"
        icon={<svg />}
      />,
    );
    has(document.querySelector('[data-tone]'), 'bg-bg');
  });
});
