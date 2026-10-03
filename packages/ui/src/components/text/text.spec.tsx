import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Text } from './text';

describe('Text', () => {
  it('renders a <p> by default', () => {
    render(<Text>Hello</Text>);
    expect(screen.getByText('Hello').tagName).toBe('P');
  });

  it('renders the tag given in `as`, with a matching ref type', () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Text as="span" ref={ref}>
        Inline
      </Text>,
    );
    expect(screen.getByText('Inline').tagName).toBe('SPAN');
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('applies tone, size and weight classes', () => {
    render(
      <Text tone="muted" size="sm" weight="semibold">
        Note
      </Text>,
    );
    const classes = screen.getByText('Note').className.split(' ');
    expect(classes).toEqual(
      expect.arrayContaining(['text-fg-muted', 'text-sm', 'font-semibold']),
    );
  });

  it('lines up digits with `numeric`', () => {
    render(<Text numeric>$1,111.11</Text>);
    expect(screen.getByText('$1,111.11').className).toContain('tabular-nums');
  });

  it('keeps the public props strict per tag (compile-time check)', () => {
    // `htmlFor` exists on <label>, not on <p>. If the polymorphic types ever get
    // loosened by mistake, this @ts-expect-error turns into a typecheck failure.
    // @ts-expect-error htmlFor is not a <p> attribute
    render(<Text htmlFor="x">Strict</Text>);
    expect(screen.getByText('Strict')).toBeTruthy();
  });
});
