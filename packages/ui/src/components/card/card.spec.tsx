import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../button';
import { Heading } from '../heading';
import { Card, CardLink } from './card';

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

describe('CardLink', () => {
  function Invoice({ onOpen = () => undefined, onDownload = () => undefined }) {
    return (
      <Card as="article" data-testid="card">
        <Heading level={3}>
          <CardLink href="#inv-1042" onPress={onOpen}>
            INV-1042
          </CardLink>
        </Heading>
        <p>Northwind Traders · $1,200.00</p>
        <Button onClick={onDownload}>Download PDF</Button>
      </Card>
    );
  }

  it('is a real link named by the title only, not the whole card', () => {
    render(<Invoice />);
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#inv-1042');
    expect(link.textContent).toBe('INV-1042');
  });

  it('stretches an overlay over the card, and the card lifts its own controls above it', () => {
    render(<Invoice />);
    expect(screen.getByRole('link').className).toContain('after:inset-0');
    // Real hit-testing needs a browser (checked in Chromium); this guards the class.
    expect(screen.getByTestId('card').className).toMatch(
      /has-\[\[data-card-link\]\]:\[&_:is\(a,button[^\s]*:z-10/,
    );
  });

  it('Enter on the link opens it; the inner button is a separate Tab stop that does its own thing', () => {
    const onOpen = vi.fn();
    const onDownload = vi.fn();
    render(<Invoice onOpen={onOpen} onDownload={onDownload} />);
    const link = screen.getByRole('link');
    act(() => link.focus());
    fireEvent.keyDown(link, { key: 'Enter' });
    fireEvent.keyUp(link, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(1);
    // The button isn't inside the link (that would be invalid HTML).
    expect(link.contains(screen.getByRole('button'))).toBe(false);
  });
});
