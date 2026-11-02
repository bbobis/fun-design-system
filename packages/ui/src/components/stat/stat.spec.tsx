import { render, screen, within } from '@testing-library/react';
import { must } from '../../utils/must';
import { changeOf, Stat, StatGroup } from './stat';

const usd: Intl.NumberFormatOptions = {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
};

/** Text a screen reader gets: aria-hidden parts left out. */
const spoken = (el: Element): string =>
  Array.from(el.childNodes)
    .map((n) =>
      n.nodeType === Node.TEXT_NODE
        ? (n.textContent ?? '')
        : (n as Element).getAttribute('aria-hidden') === 'true'
          ? ''
          : spoken(n as Element),
    )
    .join('');

describe('Stat', () => {
  it('a lone Stat is its own <dl> with the label as <dt> and the value as <dd>', () => {
    const { container } = render(
      <Stat label="Revenue" value={84210} format={usd} locale="en-US" />,
    );
    const dl = must(container.querySelector('dl'));
    expect(must(dl.querySelector('dt')).textContent).toBe('Revenue');
    expect(must(dl.querySelector('dd')).textContent).toContain('$84,210');
  });

  it('inside a StatGroup, all Stats share one <dl>', () => {
    const { container } = render(
      <StatGroup aria-label="This month">
        <Stat label="Revenue" value={1} />
        <Stat label="Invoices" value={2} />
      </StatGroup>,
    );
    expect(container.querySelectorAll('dl')).toHaveLength(1);
    expect(container.querySelectorAll('dt')).toHaveLength(2);
  });

  it('shows "+12.0%" with an arrow, but says "Up 12.0% vs September"', () => {
    const { container } = render(
      <Stat
        label="Revenue"
        value={84000}
        previous={75000}
        period="vs September"
        locale="en-US"
      />,
    );
    const dd = must(container.querySelector('dd'));
    expect(dd.textContent).toContain('+12.0%');
    expect(spoken(dd)).toContain('Up 12.0% vs September');
    expect(spoken(dd)).not.toContain('+');
  });

  it('a rise is good by default (success), bad with goodWhen="down" (danger)', () => {
    const badge = (c: HTMLElement) =>
      must(c.querySelector('dd [aria-hidden="true"]'));
    const up = render(<Stat label="Revenue" value={11} previous={10} />);
    expect(badge(up.container).className).toContain('bg-success-soft');
    up.unmount();
    const overdue = render(
      <Stat label="Overdue" value={11} previous={10} goodWhen="down" />,
    );
    expect(badge(overdue.container).className).toContain('bg-danger-soft');
  });

  it('no change reads "No change" and is neither good nor bad', () => {
    const { container } = render(
      <Stat label="Customers" value={128} previous={128} locale="en-US" />,
    );
    const dd = must(container.querySelector('dd'));
    expect(spoken(dd)).toContain('No change');
    expect(must(dd.querySelector('[aria-hidden="true"]')).className).toContain(
      'bg-surface',
    );
  });

  it('no previous value, or a previous of 0: no change is shown', () => {
    const { container } = render(
      <Stat label="Revenue" value={500} previous={0} />,
    );
    expect(must(container.querySelector('dd')).textContent).not.toContain('%');
    expect(changeOf(500, 0)).toBeUndefined();
    expect(changeOf(500)).toBeUndefined();
    expect(changeOf(90, -100)).toBeCloseTo(1.9); // from a loss to a profit: up
  });

  it('the sparkline is decoration, unless it gets a label', () => {
    const { container, rerender } = render(
      <Stat label="Revenue" value={84} sparkline={[61, 70, 84]} />,
    );
    const svg = () => must(container.querySelector('dd > svg'));
    expect(svg().getAttribute('aria-hidden')).toBe('true');
    rerender(
      <Stat
        label="Revenue"
        value={84}
        sparkline={[61, 70, 84]}
        sparklineLabel="Revenue, last 3 months: 61k to 84k"
      />,
    );
    expect(
      screen.getByRole('img', { name: 'Revenue, last 3 months: 61k to 84k' }),
    ).toBe(svg());
  });

  it('loading: a placeholder, aria-busy, and "Loading" for screen readers', () => {
    const { container } = render(<Stat label="Revenue" value={0} loading />);
    const dd = must(container.querySelector('dd'));
    expect(dd.getAttribute('aria-busy')).toBe('true');
    expect(within(dd).getByText('Loading')).toBeTruthy();
    expect(dd.textContent).not.toContain('0');
  });

  it('formats with the given locale and options (compact)', () => {
    const { container } = render(
      <Stat
        label="Rows"
        value={1_240_000}
        locale="en-US"
        format={{ notation: 'compact' }}
      />,
    );
    expect(must(container.querySelector('dd')).textContent).toContain('1.2M');
  });
});
