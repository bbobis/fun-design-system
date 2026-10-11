import { render, screen, within } from '@testing-library/react';
import { Breadcrumbs } from './breadcrumbs';

const items = [
  { label: 'Home', href: '/' },
  { label: 'Invoices', href: '/invoices' },
  { label: 'INV-2041' },
];

describe('Breadcrumbs', () => {
  it('is a nav landmark named "Breadcrumbs" with one list item per level', () => {
    render(<Breadcrumbs items={items} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumbs' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(3);
  });

  it('every level above the current page is a link to its href', () => {
    render(<Breadcrumbs items={items} />);
    expect(
      screen.getByRole('link', { name: 'Home' }).getAttribute('href'),
    ).toBe('/');
    expect(
      screen.getByRole('link', { name: 'Invoices' }).getAttribute('href'),
    ).toBe('/invoices');
  });

  it('the last item is the current page and not a working link', () => {
    render(<Breadcrumbs items={items} />);
    const current = screen.getByText('INV-2041');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.hasAttribute('href')).toBe(false);
  });

  it('separators are hidden from screen readers', () => {
    const { container } = render(<Breadcrumbs items={items} />);
    for (const svg of container.querySelectorAll('svg')) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('takes a custom landmark name', () => {
    render(<Breadcrumbs items={items} aria-label="Folder path" />);
    expect(
      screen.getByRole('navigation', { name: 'Folder path' }),
    ).toBeTruthy();
  });
});
