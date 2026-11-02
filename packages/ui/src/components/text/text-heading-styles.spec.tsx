import { render, screen } from '@testing-library/react';
import { Heading } from '../heading';
import { Text } from './text';

describe('Text styles', () => {
  it('status tones use the new fg tokens', () => {
    render(
      <>
        <Text tone="success">Paid</Text>
        <Text tone="warning">Due soon</Text>
        <Text tone="info">Note</Text>
      </>,
    );
    expect(screen.getByText('Paid').className).toContain('text-fg-success');
    expect(screen.getByText('Due soon').className).toContain('text-fg-warning');
    expect(screen.getByText('Note').className).toContain('text-fg-info');
  });

  it('truncate: one line or n lines; the full text stays in the DOM', () => {
    const long =
      'A long sentence that will not fit on one line in a narrow box.';
    render(
      <>
        <Text truncate>{long}</Text>
        <Text truncate={3} as="span">
          {long}
        </Text>
      </>,
    );
    const [one, three] = screen.getAllByText(long);
    expect(one.className).toContain('truncate');
    expect(three.className).toContain('line-clamp-3');
    expect(one.textContent).toBe(long);
  });

  it('no truncate by default', () => {
    render(<Text>Short</Text>);
    expect(screen.getByText('Short').className).not.toMatch(
      /truncate|line-clamp/,
    );
  });
});

describe('Heading styles', () => {
  it('display sizes, weight and tone', () => {
    render(
      <Heading level={1} size="4xl" weight="bold" tone="muted">
        Hero
      </Heading>,
    );
    const h = screen.getByRole('heading', { level: 1 });
    expect(h.className).toContain('text-5xl/tight');
    expect(h.className).toContain('font-bold');
    expect(h.className).toContain('text-fg-muted');
  });

  it('semibold and default tone unless set', () => {
    render(<Heading level={2}>Plain</Heading>);
    const h = screen.getByRole('heading', { level: 2 });
    expect(h.className).toContain('font-semibold');
    expect(h.className).toContain('text-fg');
  });

  it('the prediction: the eyebrow sits next to the heading, so the name is only the title', () => {
    render(
      <Heading level={2} eyebrow="Billing">
        Invoices
      </Heading>,
    );
    const h = screen.getByRole('heading', { level: 2, name: 'Invoices' });
    expect(h.parentElement?.tagName).toBe('HGROUP');
    const eyebrow = screen.getByText('Billing');
    expect(eyebrow.tagName).toBe('P');
    expect(h.contains(eyebrow)).toBe(false);
  });

  it('without an eyebrow there is no hgroup wrapper', () => {
    render(<Heading level={3}>Alone</Heading>);
    expect(screen.getByRole('heading').parentElement?.tagName).not.toBe(
      'HGROUP',
    );
  });

  it('truncate works on headings too', () => {
    render(
      <Heading level={3} truncate={2}>
        Long
      </Heading>,
    );
    expect(screen.getByRole('heading').className).toContain('line-clamp-2');
  });
});
