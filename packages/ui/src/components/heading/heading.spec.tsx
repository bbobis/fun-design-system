import { render, screen } from '@testing-library/react';
import { Heading } from './heading';

describe('Heading', () => {
  it('renders the tag that matches `level`', () => {
    render(<Heading level={3}>Billing</Heading>);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Billing' }),
    ).toBeTruthy();
  });

  it('keeps the level when the visual size is changed', () => {
    render(
      <Heading level={2} size="2xl">
        Overview
      </Heading>,
    );
    const heading = screen.getByRole('heading', { name: 'Overview' });
    expect(heading.tagName).toBe('H2'); // structure unchanged
    expect(heading.className).toContain('text-3xl'); // looks like an h1
  });

  it('picks a default size from the level', () => {
    render(<Heading level={1}>Invoices</Heading>);
    expect(screen.getByRole('heading', { level: 1 }).className).toContain(
      'text-3xl',
    );
  });
});
