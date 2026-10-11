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
});
