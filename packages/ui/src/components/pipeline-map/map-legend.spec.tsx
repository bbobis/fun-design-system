import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MapLegend } from './map-legend';
import type { MapFilter } from './pipeline-filter';

const PRODUCTS = ['SYN', 'DIL', 'SWT', 'CON', 'HVY', 'LSB', 'XTRA', 'YTRA'];

describe('MapLegend', () => {
  it('is a named region of titled lists', () => {
    render(<MapLegend products={['SYN']} />);
    const legend = screen.getByRole('region', { name: 'Map legend' });
    for (const title of [
      'Products',
      'Pipe status',
      'Line width',
      'Facilities',
    ]) {
      expect(within(legend).getByRole('list', { name: title })).toBeTruthy();
    }
  });

  it('lists six products, then folds the rest into "Other"', () => {
    render(<MapLegend products={PRODUCTS} />);
    const items = within(screen.getByRole('list', { name: 'Products' }))
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual([
      'SYN',
      'DIL',
      'SWT',
      'CON',
      'HVY',
      'LSB',
      'Other · XTRA, YTRA',
    ]);
  });

  it('draws each product with the same look the map uses', () => {
    const { container } = render(<MapLegend products={PRODUCTS} />);
    const looks = [...container.querySelectorAll('[data-product]')].map(
      (g) => ({
        product: g.getAttribute('data-product'),
        color: g
          .querySelector('path')
          ?.getAttribute('class')
          ?.match(/stroke-(?:product|line)-[\w-]+/)?.[0],
        striped: g.querySelector('[data-stripes]') !== null,
      }),
    );
    expect(looks[0]).toEqual({
      product: 'SYN',
      color: 'stroke-product-1',
      striped: false,
    });
    expect(looks[3]).toEqual({
      product: 'CON',
      color: 'stroke-product-1',
      striped: true,
    });
    expect(looks.at(-1)).toMatchObject({
      color: 'stroke-line-neutral',
      striped: true,
    }); // Other
  });

  it('shows readable product names when given', () => {
    render(
      <MapLegend
        products={['SYN']}
        productNames={{ SYN: 'Synthetic crude' }}
      />,
    );
    expect(screen.getByText('· Synthetic crude')).toBeTruthy();
  });

  it('names every status and kind in words (swatches are hidden from screen readers)', () => {
    const { container } = render(<MapLegend products={['SYN']} />);
    const statuses = within(screen.getByRole('list', { name: 'Pipe status' }))
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(statuses).toEqual(['running', 'restricted', 'shutdown']);
    const kinds = within(screen.getByRole('list', { name: 'Facilities' }))
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(kinds).toEqual([
      'terminal',
      'pump station',
      'tank farm',
      'refinery',
    ]);
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('takes its own label, className and attributes', () => {
    render(
      <MapLegend
        products={[]}
        aria-label="Key"
        className="mt-4"
        data-testid="legend"
      />,
    );
    const legend = screen.getByRole('region', { name: 'Key' });
    expect(legend.getAttribute('class')).toContain('mt-4');
    expect(legend.getAttribute('data-testid')).toBe('legend');
  });

  describe('as filters (with onFilterChange)', () => {
    /** A legend that keeps its own filter, like a page would, and reports it. */
    function Harness({ onChange }: { onChange: (f: MapFilter) => void }) {
      const [filter, setFilter] = useState<MapFilter>({});
      return (
        <MapLegend
          products={PRODUCTS}
          filter={filter}
          onFilterChange={(f) => {
            setFilter(f);
            onChange(f);
          }}
        />
      );
    }
    const toggle = (name: RegExp) => screen.getByRole('button', { name });

    it('a plain legend has no buttons', () => {
      render(<MapLegend products={PRODUCTS} />);
      expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('products and statuses become named toolbars of toggle buttons', () => {
      render(<Harness onChange={() => undefined} />);
      // A toolbar: one Tab stop, arrow keys inside (React Aria's ToggleButtonGroup).
      const products = screen.getByRole('toolbar', { name: 'Products' });
      expect(products.getAttribute('aria-orientation')).toBe('vertical');
      expect(screen.getByRole('toolbar', { name: 'Pipe status' })).toBeTruthy();
      expect(toggle(/^SYN/).getAttribute('aria-pressed')).toBe('false');
      // Line width and facility shapes aren't filters: still plain lists.
      expect(screen.getByRole('list', { name: 'Facilities' })).toBeTruthy();
    });

    it('clicking toggles: pressed state, the filter, and a Clear button', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      expect(
        screen.queryByRole('button', { name: 'Clear filters' }),
      ).toBeNull();

      await user.click(toggle(/^SYN/));
      await user.click(toggle(/^shutdown/));
      expect(onChange).toHaveBeenLastCalledWith({
        products: ['SYN'],
        statuses: ['shutdown'],
      });
      expect(toggle(/^SYN/).getAttribute('aria-pressed')).toBe('true');

      await user.click(screen.getByRole('button', { name: 'Clear filters' }));
      expect(onChange).toHaveBeenLastCalledWith({});
      expect(toggle(/^SYN/).getAttribute('aria-pressed')).toBe('false');
    });

    it('"Other" toggles every product past the sixth at once', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      await user.click(toggle(/^Other/));
      expect(onChange).toHaveBeenLastCalledWith({ products: ['XTRA', 'YTRA'] });
      expect(toggle(/^Other/).getAttribute('aria-pressed')).toBe('true');
    });

    it('keyboard: one Tab stop per group, arrows move, Space toggles', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Harness onChange={onChange} />);
      await user.tab();
      expect(document.activeElement).toBe(toggle(/^SYN/));
      await user.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(toggle(/^DIL/));
      await user.keyboard(' ');
      expect(onChange).toHaveBeenLastCalledWith({ products: ['DIL'] });
      await user.tab(); // leaves Products, lands in Pipe status
      expect(document.activeElement).toBe(toggle(/^running/));
    });
  });
});
