import { act, fireEvent, render, screen } from '@testing-library/react';
import { Button } from '../button';
import { Heading } from '../heading';
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
} from './card';

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

describe('Card parts', () => {
  it('CardHeader: an h3 title by default, with description and actions', () => {
    render(
      <Card>
        <CardHeader
          title="Northwind"
          description="Customer since 2019"
          actions={<button>More</button>}
        />
        <CardBody>Body</CardBody>
        <CardFooter>
          <button>Save</button>
        </CardFooter>
      </Card>,
    );
    const heading = screen.getByRole('heading', { name: 'Northwind' });
    expect(heading.tagName).toBe('H3');
    expect(screen.getByText('Customer since 2019')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'More' })).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
  });

  it('headingLevel changes the tag; titleId lets a section be named by the title', () => {
    render(
      <Card as="section" aria-labelledby="t">
        <CardHeader title="Outstanding" headingLevel={2} titleId="t" />
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Outstanding' })).toBeTruthy();
  });

  it.each([
    ['sm', '-mx-3'],
    ['md', '-mx-5'],
    ['lg', '-mx-8'],
  ] as const)(
    'CardMedia cancels the Card padding (%s → %s)',
    (padding, bleed) => {
      render(
        <Card padding={padding}>
          <CardMedia>
            <img alt="" data-testid="img" />
          </CardMedia>
        </Card>,
      );
      expect(screen.getByTestId('img').parentElement?.className).toContain(
        bleed,
      );
    },
  );

  it('CardMedia with padding="none" adds no negative margin', () => {
    render(
      <Card padding="none">
        <CardMedia>
          <img alt="" data-testid="img" />
        </CardMedia>
      </Card>,
    );
    expect(screen.getByTestId('img').parentElement?.className).not.toMatch(
      /-m[xt]-/,
    );
  });
});
