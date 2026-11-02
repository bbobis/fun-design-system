import { render, screen } from '@testing-library/react';
import { BatchTrain, productStyle, type BatchTrainProps } from './batch-train';
import type { Batch } from './pipeline-model';

const PRODUCTS = ['SYN', 'DIL', 'SWT', 'CON', 'HVY', 'LSB', 'XTRA'];
const batch = (name: string, product: string, volume: number): Batch => ({
  name,
  product,
  volume,
});
const renderTrain = (props: Partial<BatchTrainProps> = {}) =>
  render(
    <svg>
      <BatchTrain
        points={[
          { x: 0, y: 1 },
          { x: 10, y: 1 },
        ]}
        batches={[
          batch('A', 'SYN', 500),
          batch('B', 'DIL', 300),
          batch('C', 'CON', 200),
        ]}
        products={PRODUCTS}
        unitsPerPx={0.1}
        {...props}
      />
    </svg>,
  );
const pieces = (container: HTMLElement) =>
  [...container.querySelectorAll<SVGGElement>('[data-batch]')].map((g) => ({
    name: g.getAttribute('data-batch'),
    d: g.querySelector('path')?.getAttribute('d'),
    striped: g.querySelector('[data-stripes]') !== null,
    className: g.querySelector('path')?.getAttribute('class') ?? '',
  }));

describe('productStyle', () => {
  it('slots 1–3 are solid hues, 4–6 the same hues striped', () => {
    expect(productStyle('SYN', PRODUCTS)).toEqual({
      colorClass: 'stroke-product-1',
      striped: false,
      slot: 1,
    });
    expect(productStyle('CON', PRODUCTS)).toEqual({
      colorClass: 'stroke-product-1',
      striped: true,
      slot: 4,
    });
    expect(productStyle('LSB', PRODUCTS).colorClass).toBe('stroke-product-3');
  });

  it('a 7th or unlisted product is "other": neutral and striped', () => {
    for (const p of ['XTRA', 'NOPE']) {
      expect(productStyle(p, PRODUCTS)).toEqual({
        colorClass: 'stroke-line-neutral',
        striped: true,
        slot: null,
      });
    }
  });
});

describe('BatchTrain', () => {
  it('draws one piece per batch, in data order, sized by volume', () => {
    const { container } = renderTrain();
    // Offset 10px × 0.1 = 1 unit above (y 1 → 0). Gap 2px × 0.1 = 0.2 units.
    // A (oldest) is downstream: x 5 → 10. C (newest) upstream: x 0 → 2.
    expect(pieces(container)).toMatchObject([
      { name: 'A', d: 'M 5.1 0 L 10 0' },
      { name: 'B', d: 'M 2.1 0 L 4.9 0' },
      { name: 'C', d: 'M 0 0 L 1.9 0' },
    ]);
  });

  it('colors follow the product, and striped products get stripes', () => {
    const { container } = renderTrain();
    const [a, , c] = pieces(container);
    expect(a?.className).toContain('stroke-product-1');
    expect(a?.striped).toBe(false);
    expect(c?.className).toContain('stroke-product-1'); // CON = slot 4: same hue…
    expect(c?.striped).toBe(true); // …plus stripes
  });

  it('insetPx leaves a gap at both ends, and the batches fill the rest', () => {
    const { container } = renderTrain({ insetPx: 10 }); // 10px × 0.1 = 1 unit each end
    const [a, , c] = pieces(container);
    expect(a?.d?.endsWith('L 9 0')).toBe(true); // was 10
    expect(c?.d?.startsWith('M 1 0')).toBe(true); // was 0
  });

  it('draws nothing when the inset would swallow the whole pipe', () => {
    const { container } = renderTrain({ insetPx: 60 }); // 6 units each end of a 10-unit pipe
    expect(container.querySelectorAll('[data-batch]')).toHaveLength(0);
  });

  it('keeps pixel sizes whatever the scale', () => {
    const { container } = renderTrain();
    for (const path of container.querySelectorAll('path')) {
      expect(path.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    }
  });

  it('skips batches with no volume and draws nothing for an empty pipe', () => {
    const { container } = renderTrain({
      batches: [batch('A', 'SYN', 0), batch('B', 'DIL', 100)],
    });
    expect(pieces(container).map((p) => p.name)).toEqual(['B']);
    const empty = renderTrain({ batches: [] });
    expect(empty.container.querySelectorAll('[data-batch]')).toHaveLength(0);
  });

  it('is named when labelled, decorative otherwise', () => {
    renderTrain({ label: '3 batches' });
    expect(screen.getByRole('img', { name: '3 batches' })).toBeTruthy();
    const { container } = renderTrain();
    expect(container.querySelector('g')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('passes className and native attributes to the group', () => {
    const { container } = renderTrain({
      className: '[--batch-w:6px]',
      'data-segment-id': 's1',
    } as Partial<BatchTrainProps>);
    const g = container.querySelector('g');
    expect(g?.getAttribute('data-segment-id')).toBe('s1');
    expect(g?.getAttribute('class')).toContain('[--batch-w:6px]');
    expect(g?.getAttribute('class')).not.toContain('[--batch-w:4px]');
  });
});
