import { render, screen } from '@testing-library/react';
import { Bento, BentoTile, resolve } from './bento';

const classesOf = (el: Element) => el.className.split(/\s+/);

describe('resolve (mobile-first values)', () => {
  it('a plain number applies at every width', () => {
    expect(resolve(3, 1)).toEqual([3, 3, 3, 3, 3]);
  });
  it('each width inherits the one before it', () => {
    // base, sm, md, lg, xl
    expect(resolve({ md: 2, xl: 4 }, 1)).toEqual([1, 1, 2, 2, 4]);
  });
});

describe('Bento', () => {
  it('sets columns per container width with full, literal Tailwind classes', () => {
    render(
      <Bento columns={{ base: 1, md: 2, lg: 4 }} data-testid="grid">
        <BentoTile>a</BentoTile>
      </Bento>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.parentElement?.className).toBe('@container');
    expect(classesOf(grid)).toEqual(
      expect.arrayContaining([
        'grid',
        'grid-cols-1',
        '@min-[48rem]:grid-cols-2',
        '@min-[64rem]:grid-cols-4',
      ]),
    );
    // Only where the value changes: no class for sm (it inherits 1).
    expect(grid.className).not.toContain('@min-[40rem]:');
  });

  it('caps a tile span at the column count for each width', () => {
    render(
      <Bento columns={{ base: 1, md: 2 }}>
        <BentoTile span={4} data-testid="tile">
          wide
        </BentoTile>
      </Bento>,
    );
    const c = classesOf(screen.getByTestId('tile'));
    expect(c).toContain('col-span-1');
    expect(c).toContain('@min-[48rem]:col-span-2');
    expect(c.some((x) => /col-span-[3-6]/.test(x))).toBe(false);
  });

  it('row spans, per width', () => {
    render(
      <Bento>
        <BentoTile rows={{ base: 1, lg: 2 }} data-testid="tile">
          tall on wide screens
        </BentoTile>
      </Bento>,
    );
    const c = classesOf(screen.getByTestId('tile'));
    expect(c).toContain('row-span-1');
    expect(c).toContain('@min-[64rem]:row-span-2');
  });

  it('as="ul" / as="li": a named list of tiles', () => {
    render(
      <Bento as="ul" aria-label="Customers">
        <BentoTile as="li">A</BentoTile>
        <BentoTile as="li">B</BentoTile>
      </Bento>,
    );
    const list = screen.getByRole('list', { name: 'Customers' });
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(list.className).toContain('list-none');
  });

  it('keeps tiles in source order (no order or dense packing)', () => {
    render(
      <Bento data-testid="grid">
        <BentoTile>first</BentoTile>
        <BentoTile span={2}>second</BentoTile>
      </Bento>,
    );
    const grid = screen.getByTestId('grid');
    expect(grid.className).not.toMatch(/grid-flow-.*dense|order-/);
    expect(grid.textContent).toBe('firstsecond');
  });

  it('surface gives a tile its own look and padding; none is the default', () => {
    render(
      <Bento>
        <BentoTile data-testid="plain">a</BentoTile>
        <BentoTile data-testid="card" surface="card" padding="sm">
          b
        </BentoTile>
        <BentoTile data-testid="muted" surface="muted">
          c
        </BentoTile>
      </Bento>,
    );
    expect(screen.getByTestId('plain').className).not.toMatch(
      /border|bg-|p-\d/,
    );
    expect(screen.getByTestId('card').className).toContain('border');
    expect(screen.getByTestId('card').className).toContain('p-3');
    expect(screen.getByTestId('muted').className).toContain('bg-surface');
  });

  it('inverse uses data-inverse (opposite theme), not new colours', () => {
    render(
      <Bento>
        <BentoTile data-testid="featured" surface="inverse">
          x
        </BentoTile>
      </Bento>,
    );
    const tile = screen.getByTestId('featured');
    expect(tile.hasAttribute('data-inverse')).toBe(true);
    expect(tile.className).toContain('bg-bg');
  });

  it('the prediction: tiled draws lines per tile, so empty spots stay the page colour', () => {
    render(
      <Bento variant="tiled" gap="lg">
        <BentoTile data-testid="t" surface="card">
          x
        </BentoTile>
        <BentoTile data-testid="bare">y</BentoTile>
      </Bento>,
    );
    const tile = screen.getByTestId('t');
    const grid = tile.parentElement as HTMLElement;
    expect(grid.className).toContain('gap-px');
    expect(grid.className).not.toContain('gap-6'); // `gap` is ignored when tiled
    expect(grid.className).not.toContain('bg-border'); // no painted frame
    expect(tile.className).toContain('shadow-[0_0_0_1px_var(--color-border)]');
    expect(tile.className).toContain('rounded-none');
    expect(tile.className).not.toMatch(/(^| )border( |$)/);
    // A tile without a surface still gets a background in a tiled Bento.
    expect(screen.getByTestId('bare').className).toContain('bg-bg');
  });
});
