import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';
import type { Tank } from './pipeline-model';

/** Bar size and spacing, in px. */
const BAR = { width: 8, height: 26, step: 12 };

/** How full a tank is, 0–1. A missing or zero capacity counts as empty. */
export function tankFill(tank: Tank): number {
  if (!(tank.capacity > 0) || !Number.isFinite(tank.volume)) return 0;
  return Math.min(Math.max(tank.volume / tank.capacity, 0), 1);
}

/** Width of a gauge for `count` tanks, in px (bars plus the "74%" text). */
export function tankGaugeWidth(count: number): number {
  return count > 0 ? count * BAR.step + 32 : 0;
}

const percent = (fill: number) => `${Math.round(fill * 100)}%`;

/**
 * What a screen reader hears: "3 tanks, 74% full on average. T-3 96%, high."
 * High tanks are named, so the one that matters isn't lost in the average.
 */
export function tankGaugeLabel(
  tanks: readonly Tank[],
  highLevel: number,
): string {
  if (tanks.length === 0) return 'No tanks';
  const fills = tanks.map(tankFill);
  const average = fills.reduce((a, b) => a + b, 0) / fills.length;
  const high = tanks
    .filter((tank) => tankFill(tank) >= highLevel)
    .map((tank) => `${tank.label} ${percent(tankFill(tank))}, high`);
  const count = `${tanks.length} ${tanks.length === 1 ? 'tank' : 'tanks'}`;
  return [`${count}, ${percent(average)} full on average`, ...high].join('. ');
}

export type TankGaugeProps = Omit<ComponentProps<'g'>, 'children'> & {
  /** The facility's tanks, drawn left to right in this order. */
  tanks: readonly Tank[];
  /**
   * Fill (0–1) at which a tank counts as high: its bar turns orange and the label
   * names it.
   * @default 0.9
   */
  highLevel?: number;
};

/**
 * Tank levels at a facility: one small bar per tank, filled from the bottom, plus the
 * average as text. Drawn in **pixels** from its own top-left corner; place it with a
 * `transform` (a `FacilityNode` does this for you when it's a child).
 *
 * A high tank is orange **and** named in the label, never color alone.
 */
export function TankGauge({
  tanks,
  highLevel = 0.9,
  className,
  ...props
}: TankGaugeProps) {
  const fills = tanks.map(tankFill);
  const average = fills.length
    ? fills.reduce((a, b) => a + b, 0) / fills.length
    : 0;
  return (
    <g
      role="img"
      aria-label={tankGaugeLabel(tanks, highLevel)}
      {...props}
      className={cn('text-[11px]', className)}
    >
      {tanks.map((tank, i) => {
        const fill = fills[i] as number;
        const high = fill >= highLevel;
        const filled = BAR.height * fill;
        return (
          <g
            key={tank.id}
            transform={`translate(${i * BAR.step} 0)`}
            data-tank={tank.id}
            data-high={high || undefined}
          >
            <rect
              width={BAR.width}
              height={BAR.height}
              rx={2}
              className="fill-bg stroke-border-strong"
            />
            <rect
              y={BAR.height - filled}
              width={BAR.width}
              height={filled}
              rx={1}
              className={high ? 'fill-line-warning' : 'fill-fg-muted'}
            />
          </g>
        );
      })}
      {tanks.length > 0 && (
        <text
          x={tanks.length * BAR.step + 4}
          y={BAR.height - 8}
          aria-hidden
          className="fill-fg-muted tabular-nums"
        >
          {percent(average)}
        </text>
      )}
    </g>
  );
}
