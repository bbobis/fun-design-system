import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, RouterProvider } from './link';

describe('Link', () => {
  it('is a real <a> with its href, named by its text', () => {
    render(<Link href="/invoices">Invoices</Link>);
    const link = screen.getByRole('link', { name: 'Invoices' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/invoices');
    expect(link.getAttribute('target')).toBeNull();
  });

  it('inline is underlined (not color alone); standalone is not until hover', () => {
    render(
      <>
        <Link href="/a">Inline</Link>
        <Link href="/b" variant="standalone">
          Standalone
        </Link>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Inline' }).className).toMatch(
      /(^| )underline( |$)/,
    );
    const standalone = screen.getByRole('link', { name: 'Standalone' });
    expect(standalone.className).toContain('no-underline');
    expect(standalone.className).toContain('data-hovered:underline');
  });

  it('external: new tab, safe rel, and "opens in a new tab" in the name (the prediction)', () => {
    render(
      <Link href="https://www.w3.org/WAI/" external>
        WAI guidelines
      </Link>,
    );
    const link = screen.getByRole('link', {
      name: 'WAI guidelines, opens in a new tab',
    });
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    // The icon is decoration; the words carry the meaning.
    expect(link.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    // Visible text is still just the link text.
    expect(link.querySelector('.sr-only')?.textContent).toBe(
      ', opens in a new tab',
    );
  });

  it('download, aria-current, aria-label, id and className pass through', () => {
    render(
      <Link
        href="/report.csv"
        download="report.csv"
        aria-current="page"
        aria-label="Download the report"
        id="dl"
        className="ms-2"
      >
        Report
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Download the report' });
    expect(link.getAttribute('download')).toBe('report.csv');
    expect(link.getAttribute('aria-current')).toBe('page');
    expect(link.id).toBe('dl');
    expect(link.className).toContain('ms-2');
  });

  it('href is required: a link that runs code is a Button', () => {
    // @ts-expect-error href is required
    void (<Link>Save</Link>);
    expect(true).toBe(true);
  });
});

describe('RouterProvider', () => {
  it('app paths go through the router (no page load); Enter works too', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <Link href="/invoices/2041">INV-2041</Link>
      </RouterProvider>,
    );
    const link = screen.getByRole('link', { name: 'INV-2041' });
    await user.click(link);
    expect(navigate).toHaveBeenLastCalledWith('/invoices/2041', undefined);
    link.focus();
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('external links and other sites are left to the browser', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <RouterProvider navigate={navigate}>
        <Link href="https://example.com" external>
          Example
        </Link>
      </RouterProvider>,
    );
    await user.click(screen.getByRole('link', { name: /Example/ }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('useHref builds the real href (a router base path)', () => {
    render(
      <RouterProvider navigate={vi.fn()} useHref={(h) => `/app${h}`}>
        <Link href="/invoices">Invoices</Link>
      </RouterProvider>,
    );
    expect(
      screen.getByRole('link', { name: 'Invoices' }).getAttribute('href'),
    ).toBe('/app/invoices');
  });
});
