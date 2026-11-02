import { render, screen } from '@testing-library/react';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('renders the title as the page h1, with description, breadcrumbs and actions', () => {
    render(
      <PageHeader
        title="Invoices"
        description="All invoices sent this year."
        breadcrumbs={<nav aria-label="Breadcrumbs">Billing</nav>}
        actions={<button type="button">New invoice</button>}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Invoices' }),
    ).toBeTruthy();
    expect(screen.getByText('All invoices sent this year.')).toBeTruthy();
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumbs' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New invoice' })).toBeTruthy();
  });

  it('only the title is required', () => {
    const { container } = render(<PageHeader title="Settings" />);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('p')).toBeNull();
  });

  it('back: a link named "Back to …" that still contains the visible words', () => {
    render(
      <PageHeader
        title="INV-1042"
        back={{ href: '/invoices', label: 'Invoices' }}
      />,
    );
    const link = screen.getByRole('link', { name: 'Back to Invoices' });
    expect(link.getAttribute('href')).toBe('/invoices');
    expect(link.textContent).toBe('Invoices');
  });

  it('the prediction: section links are links in a named nav, not a tablist', () => {
    render(
      <PageHeader
        title="INV-1042"
        nav={[
          { label: 'Overview', href: '/inv/1042', current: true },
          { label: 'Activity', href: '/inv/1042/activity', count: 12 },
        ]}
      />,
    );
    const nav = screen.getByRole('navigation', { name: 'INV-1042 sections' });
    expect(screen.queryByRole('tablist')).toBeNull();
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('aria-current')).toBe('page');
    expect(links[1].hasAttribute('aria-current')).toBe(false);
    expect(links[1].textContent).toBe('Activity12');
  });

  it('meta, size and divided', () => {
    const { container } = render(
      <PageHeader
        title="Small"
        size="sm"
        divided
        meta={<span>Owner: Ben</span>}
      />,
    );
    expect(screen.getByText('Owner: Ben')).toBeTruthy();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toContain('text-xl'); // Heading size lg
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('border-b');
    expect(root.className).toContain('mb-4');
  });

  it('md by default, no line', () => {
    const { container } = render(<PageHeader title="Plain" />);
    // Heading size xl, as before.
    expect(screen.getByRole('heading', { level: 1 }).className).toContain(
      'text-2xl',
    );
    expect(
      (container.firstElementChild as HTMLElement).className,
    ).not.toContain('border-b');
  });
});
