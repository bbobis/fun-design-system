import { render, screen, within } from '@testing-library/react';
import { MapLegend } from './map-legend';

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
});
