import { render, screen } from '@testing-library/react';
import {
  TankGauge,
  tankFill,
  tankGaugeLabel,
  tankGaugeWidth,
} from './tank-gauge';
import type { Tank } from './pipeline-model';

const tank = (id: string, volume: number, capacity = 100): Tank => ({
  id,
  label: id,
  volume,
  capacity,
});
const TANKS = [tank('T-1', 82), tank('T-2', 45), tank('T-3', 96)];

describe('tankFill', () => {
  it('is volume ÷ capacity, clamped to 0–1', () => {
    expect(tankFill(tank('a', 25))).toBe(0.25);
    expect(tankFill(tank('a', 150))).toBe(1);
    expect(tankFill(tank('a', -5))).toBe(0);
  });

  it('counts a missing or zero capacity as empty', () => {
    expect(tankFill(tank('a', 10, 0))).toBe(0);
    expect(tankFill(tank('a', Number.NaN))).toBe(0);
  });
});

describe('tankGaugeLabel', () => {
  it('gives the count and average, and names every high tank', () => {
    expect(tankGaugeLabel(TANKS, 0.9)).toBe(
      '3 tanks, 74% full on average. T-3 96%, high',
    );
  });

  it('handles one tank and no tanks', () => {
    expect(tankGaugeLabel([tank('T-1', 50)], 0.9)).toBe(
      '1 tank, 50% full on average',
    );
    expect(tankGaugeLabel([], 0.9)).toBe('No tanks');
  });
});

describe('TankGauge', () => {
  const renderGauge = (tanks = TANKS, highLevel?: number) =>
    render(
      <svg>
        <TankGauge tanks={tanks} highLevel={highLevel} />
      </svg>,
    );
  const bars = (container: HTMLElement) => [
    ...container.querySelectorAll('[data-tank]'),
  ];

  it('is one image with a spoken summary', () => {
    renderGauge();
    expect(
      screen.getByRole('img', { name: /3 tanks, 74% full on average/ }),
    ).toBeTruthy();
  });

  it('draws one bar per tank, filled from the bottom', () => {
    const { container } = renderGauge();
    expect(bars(container)).toHaveLength(3);
    const fill = bars(container)[0]?.querySelectorAll('rect')[1];
    expect(fill?.getAttribute('height')).toBe(String(26 * 0.82));
    expect(fill?.getAttribute('y')).toBe(String(26 - 26 * 0.82));
  });

  it('marks high tanks (data and color), at a level you can change', () => {
    const { container } = renderGauge();
    const high = bars(container).map((b) => b.hasAttribute('data-high'));
    expect(high).toEqual([false, false, true]);
    expect(
      bars(container)[2]?.querySelectorAll('rect')[1]?.getAttribute('class'),
    ).toContain('fill-line-warning');
    const lower = renderGauge(TANKS, 0.8);
    expect(
      bars(lower.container).map((b) => b.hasAttribute('data-high')),
    ).toEqual([true, false, true]);
  });

  it('sizes itself for centring', () => {
    expect(tankGaugeWidth(3)).toBe(68);
    expect(tankGaugeWidth(0)).toBe(0);
  });
});
