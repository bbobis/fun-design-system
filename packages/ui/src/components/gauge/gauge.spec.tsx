import { render, screen } from '@testing-library/react';
import { Gauge, type GaugeProps } from './gauge';
import { bandOf, bandZones } from './gauge-bands';

const limits = { lowLow: 500, low: 1500, high: 6000, highHigh: 7200 };

describe('bandOf', () => {
  it.each([
    [400, 'lowLow'],
    [500, 'lowLow'], // the limit itself is in the band
    [1000, 'low'],
    [3000, 'normal'],
    [6000, 'high'],
    [7200, 'highHigh'],
    [9000, 'highHigh'],
  ] as const)('%s → %s', (v, band) => {
    expect(bandOf(v, limits)).toBe(band);
  });

  it('only the limits you give count', () => {
    expect(bandOf(99, { high: 90 })).toBe('high');
    expect(bandOf(1, { high: 90 })).toBe('normal');
  });

  it('bandZones: warning between L–LL and H–HH, alarm beyond', () => {
    expect(bandZones(limits, 0, 8000)).toEqual([
      { from: 0, to: 6.25, severity: 'alarm' },
      { from: 6.25, to: 18.75, severity: 'warning' },
      { from: 75, to: 90, severity: 'warning' },
      { from: 90, to: 100, severity: 'alarm' },
    ]);
  });
});

function Pressure(props: Partial<GaugeProps>) {
  return (
    <Gauge
      label="Discharge pressure"
      value={3000}
      min={0}
      max={8000}
      unit="kPa"
      locale="en-US"
      thresholds={limits}
      {...props}
    />
  );
}

const meter = () => screen.getByRole('meter', { name: 'Discharge pressure' });

describe('Gauge', () => {
  it('is a meter named by its label, with min, max and the value', () => {
    render(<Pressure />);
    expect(meter().getAttribute('role')).toBe('meter'); // not "meter progressbar"
    expect(meter().getAttribute('aria-valuenow')).toBe('3000');
    expect(meter().getAttribute('aria-valuemin')).toBe('0');
    expect(meter().getAttribute('aria-valuemax')).toBe('8000');
  });

  it('says the value with its unit and band, not a percentage', () => {
    render(<Pressure value={6420} />);
    expect(meter().getAttribute('aria-valuetext')).toBe('6,420 kPa, high');
  });

  it('the prediction: normal is gray; only warning and alarm get color', () => {
    const { container, rerender } = render(<Pressure value={3000} />);
    const fill = () =>
      container.querySelector('[data-gauge-fill]') as HTMLElement;
    expect(fill().className).toContain('bg-fg-muted');
    expect(screen.queryByText('High')).toBeNull();
    rerender(<Pressure value={6420} />);
    expect(screen.getByText('High')).toBeTruthy();
    expect(fill().className).toContain('bg-warning');
    rerender(<Pressure value={7500} />);
    expect(fill().className).toContain('bg-danger');
    expect(meter().getAttribute('aria-valuetext')).toBe(
      '7,500 kPa, high-high alarm',
    );
    expect(screen.getByText('High-high')).toBeTruthy();
  });

  it('out of range: drawn at the end, read with the real number', () => {
    render(<Pressure value={8450} />);
    expect(meter().getAttribute('aria-valuetext')).toBe(
      '8,450 kPa, high-high alarm, above range',
    );
  });

  it('stale: gray, no band, and the reason read out', () => {
    render(<Pressure value={7500} stale="No data since 10:42" />);
    expect(meter().getAttribute('aria-valuetext')).toBe(
      '7,500 kPa, No data since 10:42',
    );
    expect(screen.queryByText('High-high')).toBeNull();
  });

  it('the visible number is hidden from screen readers (no double reading)', () => {
    render(<Pressure value={6420} />);
    const visible = screen.getByText('6,420 kPa');
    expect(visible.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('draws a tick per limit given', () => {
    render(<Pressure thresholds={{ high: 6000, highHigh: 7200 }} />);
    expect(screen.getByText('H')).toBeTruthy();
    expect(screen.getByText('HH')).toBeTruthy();
    expect(screen.queryByText('LL')).toBeNull();
  });
});
