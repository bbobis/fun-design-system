import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import type {
  Facility,
  FacilityKind,
  LabelPlacement,
  Point,
} from './pipeline-model';
import { TankGauge, tankGaugeLabel, tankGaugeWidth } from './tank-gauge';

/** Spoken name of each kind, used in the default accessible label. */
export const FACILITY_KIND_LABELS: Record<FacilityKind, string> = {
  terminal: 'terminal',
  'pump-station': 'pump station',
  'tank-farm': 'tank farm',
  refinery: 'refinery',
};

/**
 * The marker for each kind, drawn around (0, 0) in px. **Shape** tells kinds apart,
 * so it works in grayscale: square, circle, capsule, roofline.
 */
const KIND_SHAPES: Record<FacilityKind, ReactNode> = {
  terminal: <rect x={-9} y={-9} width={18} height={18} rx={3} />,
  'pump-station': <circle r={9} />,
  'tank-farm': <rect x={-9} y={-10} width={18} height={20} rx={9} ry={4} />,
  refinery: <path d="M -9 9 L -9 -3 L -3 -9 L 3 -3 L 9 -9 L 9 9 Z" />,
};

/**
 * Just the marker shape for a kind, outlined, drawn around (0, 0) in px. Shared by
 * `FacilityNode` and `MapLegend`, so the legend always matches the map.
 */
export function FacilityKindMarker({
  kind,
  filled = false,
}: {
  kind: FacilityKind;
  /** Solid fill (the selected look). */
  filled?: boolean;
}) {
  return (
    <g
      className={cn(
        'stroke-fg [stroke-width:2.5] [stroke-linejoin:round]',
        filled ? 'fill-fg' : 'fill-bg',
      )}
    >
      {KIND_SHAPES[kind]}
    </g>
  );
}

/**
 * Where the label and tank gauge go for each placement, in px around the marker.
 * The gauge stays under the marker; only `below` stacks it under the label too.
 */
export function labelLayout(placement: LabelPlacement): {
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
  gaugeY: number;
} {
  switch (placement) {
    case 'above':
      // Above the alert badge (which reaches y −21).
      return { label: { x: 0, y: -26, anchor: 'middle' }, gaugeY: 18 };
    case 'left':
      return { label: { x: -18, y: 5, anchor: 'end' }, gaugeY: 18 };
    case 'right':
      // Clear of the alert badge on the marker's top-right.
      return { label: { x: 22, y: 5, anchor: 'start' }, gaugeY: 18 };
    case 'below':
      return { label: { x: 0, y: 34, anchor: 'middle' }, gaugeY: 44 };
  }
}

/** The alert badge: warning is a triangle, danger a circle (shape **and** color). */
function AlertBadge({ level }: { level: 'warning' | 'danger' }) {
  return (
    <g transform="translate(11 -12)" aria-hidden data-alert={level}>
      {level === 'warning' ? (
        <path
          d="M 0 -9 L 9 7 L -9 7 Z"
          className="fill-warning stroke-bg [stroke-linejoin:round] [stroke-width:2]"
        />
      ) : (
        <circle r={8} className="fill-danger stroke-bg [stroke-width:2]" />
      )}
      <text
        y={level === 'warning' ? 5 : 4}
        textAnchor="middle"
        className={cn(
          'text-[11px] font-bold',
          level === 'warning' ? 'fill-on-warning' : 'fill-on-danger',
        )}
      >
        !
      </text>
    </g>
  );
}

/**
 * What a screen reader hears for a facility:
 * "Tank Farm C, tank farm. Warning: Tank 3 above 95%. 3 tanks, 74% full on average. T-3 96%, high"
 */
export function facilityLabel(
  facility: Pick<Facility, 'label' | 'kind' | 'alert' | 'tanks'>,
  highLevel = 0.9,
): string {
  const parts = [`${facility.label}, ${FACILITY_KIND_LABELS[facility.kind]}`];
  if (facility.alert) {
    const level = facility.alert.level === 'danger' ? 'Danger' : 'Warning';
    parts.push(`${level}: ${facility.alert.message}`);
  }
  if (facility.tanks?.length)
    parts.push(tankGaugeLabel(facility.tanks, highLevel));
  return parts.join('. ');
}

export type FacilityNodeProps = Omit<ComponentProps<'g'>, 'children'> & {
  /** Where the facility sits, in map grid units. */
  position: Point;
  /** Map grid units per screen pixel, so the marker is the same size on any map. */
  unitsPerPx: number;
  /** Shown under the marker, e.g. "Tank Farm C". */
  label: string;
  /** Picks the marker shape. */
  kind: FacilityKind;
  /** A problem to flag: a badge on the marker, and the message in the accessible name. */
  alert?: Facility['alert'];
  /**
   * Where the name goes around the marker.
   * @default 'below'
   */
  labelPlacement?: LabelPlacement;
  /** Tanks at this facility: drawn as a `TankGauge` under the label, and summarised in the accessible name. */
  tanks?: Facility['tanks'];
  /**
   * Tank fill (0–1) that counts as high.
   * @default 0.9
   */
  highLevel?: number;
  /** Shows the selection ring. The map sets it; also exposed as `data-selected`. */
  selected?: boolean;
};

/**
 * One facility on a Pipeline Map: a small marker on the line whose **shape** shows
 * its kind, a label under it, and an optional alert badge and tank gauge.
 * Render it inside an `<svg>`, after the pipes so it paints on top of them.
 *
 * It reads as one image to a screen reader, tanks included ("Tank Farm C, tank farm.
 * Warning: …. 3 tanks, 74% full on average").
 * It isn't focusable on its own: pass `tabIndex` (the map does, with a roving tab
 * stop) and it shows a focus ring when focused from the keyboard.
 */
export function FacilityNode({
  position,
  unitsPerPx,
  label,
  kind,
  alert,
  tanks,
  labelPlacement = 'below',
  highLevel = 0.9,
  selected = false,
  className,
  ...props
}: FacilityNodeProps) {
  const place = labelLayout(labelPlacement);
  return (
    <g
      role="img"
      aria-label={facilityLabel({ label, kind, alert, tanks }, highLevel)}
      {...props}
      transform={`translate(${position.x} ${position.y}) scale(${unitsPerPx})`}
      data-kind={kind}
      data-selected={selected || undefined}
      className={cn('group outline-hidden', className)}
    >
      {/* Two states, two looks: selected = a filled halo, focused = a ring outside it. */}
      {selected && (
        <circle r={15} data-selection-halo="" className="fill-primary" />
      )}
      <circle
        r={19}
        className="fill-none stroke-focus-ring opacity-0 [stroke-width:2] group-focus-visible:opacity-100"
      />
      {/* Selected also fills the marker solid: the yellow halo alone is only 1.7:1 on white. */}
      <FacilityKindMarker kind={kind} filled={selected} />
      {alert && <AlertBadge level={alert.level} />}
      <text
        x={place.label.x}
        y={place.label.y}
        textAnchor={place.label.anchor}
        data-placement={labelPlacement}
        aria-hidden
        // A halo in the page color keeps the label readable where it crosses a pipe.
        className="fill-fg stroke-bg text-[13px] font-semibold [paint-order:stroke] [stroke-linejoin:round] [stroke-width:4]"
      >
        {label}
      </text>
      {tanks && tanks.length > 0 && (
        // role="img" on this node makes everything inside it presentational, so the
        // gauge's own label would be lost: its summary is in the node's name instead.
        <TankGauge
          tanks={tanks}
          highLevel={highLevel}
          aria-hidden
          role="presentation"
          transform={`translate(${-tankGaugeWidth(tanks.length) / 2} ${place.gaugeY})`}
        />
      )}
    </g>
  );
}
