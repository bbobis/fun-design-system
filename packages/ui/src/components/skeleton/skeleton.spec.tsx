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
    // Animated only when motion is OK (motion-safe:), never unconditionally. Same
    // result as the old animate-pulse + motion-reduce:animate-none, in the form the
    // recipe's motion rule asks for.
    expect(el.className).toContain('motion-safe:animate-pulse');
    expect(el.className.split(' ')).not.toContain('animate-pulse');
    expect(el.className).toContain('rounded-full');
    expect(el.className).toContain('size-8');
  });
});
