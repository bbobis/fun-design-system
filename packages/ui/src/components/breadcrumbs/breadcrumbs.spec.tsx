import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Breadcrumbs, collapseItems } from './breadcrumbs';

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

const deep = [
  { label: 'Home', href: '/' },
  { label: 'Customers', href: '/customers' },
  { label: 'Acme Ltd', href: '/customers/acme' },
  { label: 'Invoices', href: '/customers/acme/invoices' },
  { label: 'INV-2041', href: '/invoices/2041' },
  { label: 'Edit line 3' },
];

describe('collapseItems', () => {
  it('keeps everything when the trail fits, or with no maxItems', () => {
    expect(collapseItems(deep).hidden).toEqual([]);
    expect(collapseItems(deep, 6).hidden).toEqual([]);
  });

  it('keeps the first and the last maxItems - 1', () => {
    const { before, hidden, after } = collapseItems(deep, 3);
    expect(before.map((i) => i.label)).toEqual(['Home']);
    expect(hidden.map((i) => i.label)).toEqual([
      'Customers',
      'Acme Ltd',
      'Invoices',
    ]);
    expect(after.map((i) => i.label)).toEqual(['INV-2041', 'Edit line 3']);
  });

  it('never shows fewer than first + current', () => {
    expect(collapseItems(deep, 1).after.map((i) => i.label)).toEqual([
      'Edit line 3',
    ]);
  });
});

describe('Breadcrumbs with maxItems', () => {
  it('shows first, a named "…" button, and the tail; the last is still current', () => {
    render(<Breadcrumbs items={deep} maxItems={3} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Customers' })).toBeNull();
    const more = screen.getByRole('button', { name: 'Show 3 more levels' });
    expect(more.getAttribute('aria-haspopup')).toBe('true');
    expect(screen.getByText('Edit line 3').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('"…" opens a menu whose items are links to the hidden levels', async () => {
    render(<Breadcrumbs items={deep} maxItems={3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more levels' }));
    await act(() => new Promise((r) => requestAnimationFrame(r)));
    const menu = screen.getByRole('menu');
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual([
      'Customers',
      'Acme Ltd',
      'Invoices',
    ]);
    expect(items[1].tagName).toBe('A');
    expect(items[1].getAttribute('href')).toBe('/customers/acme');
  });
});
