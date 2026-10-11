import { render, screen } from '@testing-library/react';
import { Button } from '../button';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders the title as a heading at the given level', () => {
    render(<EmptyState title="No invoices yet" headingLevel={3} />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'No invoices yet' }),
    ).toBeTruthy();
  });

  it('shows the description and the action', () => {
    render(
      <EmptyState
        title="No results for “acme”"
        headingLevel={2}
        description="Try a shorter search or fewer filters."
        action={<Button intent="secondary">Clear filters</Button>}
      />,
    );
    expect(
      screen.getByText('Try a shorter search or fewer filters.'),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeTruthy();
  });

  it('hides the icon from screen readers (it is decoration)', () => {
    render(
      <EmptyState
        title="Nothing here"
        headingLevel={2}
        icon={<svg data-testid="icon" />}
      />,
    );
    const wrapper = screen.getByTestId('icon').parentElement as HTMLElement;
    expect(wrapper.getAttribute('aria-hidden')).toBe('true');
  });

  it('compact uses a smaller heading and less space; className wins', () => {
    const { container } = render(
      <EmptyState
        title="No rows"
        headingLevel={4}
        size="compact"
        className="my-8"
      />,
    );
    const box = container.firstElementChild as HTMLElement;
    expect(box.className).toContain('py-6');
    expect(box.className).toContain('my-8');
    expect(
      screen.getByRole('heading', { name: 'No rows' }).className,
    ).toContain('text-sm');
  });
});
