import { render } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is hidden from screen readers: gray boxes mean nothing read aloud', () => {
    const { container } = render(<Skeleton />);
    expect(
      (container.firstElementChild as HTMLElement).getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('stops pulsing for people who prefer reduced motion', () => {
    const { container } = render(
      <Skeleton shape="circle" className="size-8" />,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('motion-reduce:animate-none');
    expect(el.className).toContain('rounded-full');
    expect(el.className).toContain('size-8');
  });
});
