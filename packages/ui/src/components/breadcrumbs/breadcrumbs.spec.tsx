import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Breadcrumbs, collapseItems } from './breadcrumbs';

const items = [
  { label: 'Home', href: '/' },
  { label: 'Invoices', href: '/invoices' },
  { label: 'INV-2041' },
];

/** The link element (or current-page span) that shows `text`. */
const linkOf = (text: string) => {
  const el = screen.getByText(text).closest<HTMLElement>('a, [role=link]');
  if (!el) throw new Error(`no link for ${text}`);
  return el;
};

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
    // The text sits in a label span inside the link; check the link itself.
    const current = linkOf('INV-2041');
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
    expect(linkOf('Edit line 3').getAttribute('aria-current')).toBe('page');
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

describe('Breadcrumbs styles', () => {
  const trail = [
    { label: 'Home', href: '/' },
    { label: 'Invoices', href: '/invoices' },
    { label: 'INV-2041' },
  ];
  const nav = () => screen.getByRole('navigation', { name: 'Breadcrumbs' });
  const hiddenSeparators = () =>
    Array.from(nav().querySelectorAll('[aria-hidden="true"]'));

  it('separator: chevron (default), slash or arrow; always hidden from screen readers', () => {
    const { rerender } = render(<Breadcrumbs items={trail} />);
    expect(nav().querySelectorAll('svg path')[0]?.getAttribute('d')).toContain(
      'm6 3.5',
    );
    rerender(<Breadcrumbs items={trail} separator="slash" />);
    expect(hiddenSeparators().map((s) => s.textContent)).toEqual([
      '/',
      '/',
      '/',
    ]);
    rerender(<Breadcrumbs items={trail} separator="arrow" />);
    expect(nav().querySelector('svg path')?.getAttribute('d')).toContain(
      'M3 8h10',
    );
    for (const svg of nav().querySelectorAll('svg'))
      expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('contained: the list sits in a rounded bar', () => {
    render(<Breadcrumbs items={trail} variant="contained" />);
    const list = screen.getByRole('list');
    expect(list.className).toContain('rounded-full');
    expect(list.className).toContain('bg-surface');
  });

  it('steps: a painted shape per level, no separators, the link itself never clipped (the prediction)', () => {
    render(<Breadcrumbs items={trail} variant="steps" />);
    const shapes = nav().querySelectorAll(
      '[aria-hidden="true"][class*="clip-path"]',
    );
    expect(shapes).toHaveLength(3);
    expect(nav().querySelectorAll('svg')).toHaveLength(0);
    for (const link of [linkOf('Home'), linkOf('Invoices'), linkOf('INV-2041')])
      expect(link.className).not.toContain('clip-path');
    expect(linkOf('INV-2041').getAttribute('aria-current')).toBe('page');
  });

  it('icons are decoration; iconOnly keeps the label as the link name', () => {
    render(
      <Breadcrumbs
        items={[
          {
            label: 'Home',
            href: '/',
            icon: <svg data-testid="home" />,
            iconOnly: true,
          },
          {
            label: 'Invoices',
            href: '/invoices',
            icon: <svg data-testid="inv" />,
          },
          { label: 'INV-2041' },
        ]}
      />,
    );
    expect(
      screen.getByTestId('home').parentElement?.getAttribute('aria-hidden'),
    ).toBe('true');
    const home = screen.getByRole('link', { name: 'Home' });
    expect(screen.getByText('Home').className).toContain('sr-only');
    expect(home.getAttribute('href')).toBe('/');
    // Without iconOnly the label stays visible.
    expect(screen.getByText('Invoices').className).not.toContain('sr-only');
  });

  it('size sm makes the text smaller', () => {
    render(<Breadcrumbs items={trail} size="sm" />);
    expect(screen.getByRole('list').className).toContain('text-xs');
  });

  it('collapsed "…" works in every variant', () => {
    const deep = [
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
      { label: 'C', href: '/c' },
      { label: 'D' },
    ];
    for (const variant of ['plain', 'contained', 'steps'] as const) {
      const { unmount } = render(
        <Breadcrumbs items={deep} maxItems={2} variant={variant} />,
      );
      expect(
        screen.getByRole('button', { name: 'Show 2 more levels' }),
      ).toBeTruthy();
      unmount();
    }
  });
});
