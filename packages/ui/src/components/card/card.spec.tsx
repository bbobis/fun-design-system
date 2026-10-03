import { render, screen } from '@testing-library/react';
import { Heading } from '../heading';
import { Card } from './card';

describe('Card', () => {
  it('renders a div by default', () => {
    render(<Card data-testid="card">Body</Card>);
    expect(screen.getByTestId('card').tagName).toBe('DIV');
  });

  it('can be a named region with `as="section"` and a labelled heading', () => {
    render(
      <Card as="section" aria-labelledby="t">
        <Heading level={2} id="t">
          Outstanding
        </Heading>
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'Outstanding' })).toBeTruthy();
  });

  it('applies variant and padding, and className wins over its own padding', () => {
    render(
      <Card variant="filled" padding="sm" className="p-6" data-testid="card">
        Body
      </Card>,
    );
    const classes = screen.getByTestId('card').className.split(' ');
    expect(classes).toContain('bg-surface');
    expect(classes).toContain('p-6');
    expect(classes).not.toContain('p-3');
  });
});
