import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { usePress } from 'react-aria';
import { cn } from '../../utils/cn';
import { Tooltip } from '../tooltip/tooltip';
import { BatchTrain } from './batch-train';
import { FacilityNode } from './facility-node';
import { PipeSegment } from './pipe-segment';
import { isArrowKey, nextInDirection } from './pipeline-navigation';
import { tankFill } from './tank-gauge';
import { segmentPoints, strokeWidthFor, toPathData } from './pipeline-geometry';
import type {
  Facility,
  PipelineNetwork,
  Point,
  Segment,
} from './pipeline-model';

/* ---------- Pure helpers (exported for tests) ---------- */

/** Space around the network for labels, badges and gauges, in px. */
export const MAP_PADDING = { x: 64, top: 36, bottom: 76 };

/** Before the first measurement (and in jsdom), assume this width. */
const FALLBACK_WIDTH_PX = 720;

/** The smallest box around every facility and waypoint, in grid units. */
export function networkBounds(network: PipelineNetwork) {
  const points: Point[] = [
    ...network.facilities.map((f) => f.position),
    ...network.segments.flatMap((s) => s.waypoints ?? []),
  ];
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/**
 * Fits the network into a box `widthPx` wide, with `padding` in **pixels** around it.
 *
 * The catch: padding is in px, but the viewBox is in grid units, and the conversion
 * (`unitsPerPx`) depends on the viewBox width, which includes the padding. Solving
 * `viewBoxWidth = span + 2·padX·unitsPerPx` with `unitsPerPx = viewBoxWidth / widthPx`
 * gives `unitsPerPx = span / (widthPx − 2·padX)`.
 */
export function mapLayout(
  network: PipelineNetwork,
  widthPx: number,
  padding = MAP_PADDING,
) {
  const b = networkBounds(network);
  const span = Math.max(b.maxX - b.minX, 1);
  const usable = Math.max(widthPx - 2 * padding.x, 1);
  const unitsPerPx = span / usable;
  const x = b.minX - padding.x * unitsPerPx;
  const y = b.minY - padding.top * unitsPerPx;
  const width = span + 2 * padding.x * unitsPerPx;
  const height = b.maxY - b.minY + (padding.top + padding.bottom) * unitsPerPx;
  return { viewBox: `${x} ${y} ${width} ${height}`, unitsPerPx };
}

const numberFormat = new Intl.NumberFormat();

/** "Terminal A to Station B, running, 1,100 m³/h, 2 batches" */
export function segmentLabel(
  segment: Segment,
  facilitiesById: ReadonlyMap<string, Facility>,
): string {
  const from = facilitiesById.get(segment.from)?.label ?? segment.from;
  const to = facilitiesById.get(segment.to)?.label ?? segment.to;
  const count = segment.batches.length;
  return `${from} to ${to}, ${segment.status}, ${numberFormat.format(segment.flowRate)} m³/h, ${count} ${count === 1 ? 'batch' : 'batches'}`;
}

/** Tooltip body for a pipe: route, status and flow, then its batches (downstream first). */
function SegmentDetails({
  segment,
  facilitiesById,
}: {
  segment: Segment;
  facilitiesById: ReadonlyMap<string, Facility>;
}) {
  const from = facilitiesById.get(segment.from)?.label ?? segment.from;
  const to = facilitiesById.get(segment.to)?.label ?? segment.to;
  return (
    <span className="flex flex-col gap-1">
      <span className="font-semibold">
        {from} → {to}
      </span>
      <span className="tabular-nums">
        {segment.status}, {numberFormat.format(segment.flowRate)} of{' '}
        {numberFormat.format(segment.maxFlowRate)} m³/h
      </span>
      {segment.batches.map((b) => (
        <span key={b.name} className="tabular-nums">
          {b.name} · {b.product} · {numberFormat.format(b.volume)} m³
        </span>
      ))}
    </span>
  );
}

/** Tooltip body for a facility: alert first, then each tank's level. */
function FacilityDetails({ facility }: { facility: Facility }) {
  return (
    <span className="flex flex-col gap-1">
      <span className="font-semibold">{facility.label}</span>
      {facility.alert && <span>{facility.alert.message}</span>}
      {facility.tanks?.map((t) => (
        <span key={t.id} className="tabular-nums">
          {t.label} · {Math.round(tankFill(t) * 100)}% ·{' '}
          {numberFormat.format(t.volume)} of {numberFormat.format(t.capacity)}{' '}
          m³
        </span>
      ))}
    </span>
  );
}

/* ---------- Context ---------- */

type MapContextValue = {
  network: PipelineNetwork;
  facilitiesById: ReadonlyMap<string, Facility>;
  products: readonly string[];
  unitsPerPx: number;
  selectedId: string | null;
  select: (id: string | null) => void;
  /** The one item that is in the tab order (roving tabindex). */
  tabStopId: string | null;
  /** Remember the item the user moved to, so Tab comes back to it. */
  setActiveId: (id: string) => void;
};

const MapContext = createContext<MapContextValue | null>(null);

function useMap(part: string): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error(`<${part}> must be inside <PipelineMap>.`);
  return ctx;
}

/** Measures an element's width, and keeps measuring as it resizes. */
function useWidth(ref: React.RefObject<Element | null>): number {
  const [width, setWidth] = useState(FALLBACK_WIDTH_PX);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(w); // jsdom reports 0: keep the fallback
    };
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/* ---------- PipelineMap ---------- */

export type PipelineMapProps = Omit<
  ComponentProps<'svg'>,
  'children' | 'onSelect' | 'viewBox'
> & {
  /** Facilities and segments to draw. Positions are hand-placed grid units. */
  network: PipelineNetwork;
  /** Product codes in legend order; a product's position picks its color everywhere. */
  products: readonly string[];
  /** Names the map for screen readers, e.g. "Mainline network". */
  'aria-label': string;
  /** The selected facility or segment id (controlled). `null` = nothing selected. */
  selectedId?: string | null;
  /** The starting selection when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called with the new id when the user selects something, or `null` when they clear it (Escape). */
  onSelect?: (id: string | null) => void;
  /**
   * The layers to draw, in paint order. Defaults to pipes, then facilities on top.
   * SVG has no z-index: what comes later covers what came before.
   */
  children?: ReactNode;
};

/**
 * A schematic pipeline network: pipes with their batches, and facilities on top.
 * It fills its container's width and keeps markers, line widths and gaps the same
 * size in pixels at any width (it measures itself to convert px to grid units).
 *
 * Keyboard: the map is **one Tab stop**. Arrow keys move along the network (facility →
 * the pipe leaving that way → the facility at its end), Home/End jump to the first and
 * last facility, Enter/Space select, Escape clears. Click works too. Hovering or
 * focusing an item shows its details (batches, tank levels) in a tooltip, which is
 * also its screen-reader description.
 *
 * Facility and segment ids must be unique across both lists.
 */
export function PipelineMap({
  network,
  products,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelect,
  children,
  className,
  onKeyDown,
  ...props
}: PipelineMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const width = useWidth(svgRef);
  const { viewBox, unitsPerPx } = useMemo(
    () => mapLayout(network, width),
    [network, width],
  );
  const facilitiesById = useMemo(
    () => new Map(network.facilities.map((f) => [f.id, f])),
    [network.facilities],
  );

  // Controlled when `selectedId` is passed, uncontrolled otherwise.
  const [own, setOwn] = useState<string | null>(defaultSelectedId);
  const selectedId = selectedProp !== undefined ? selectedProp : own;
  const select = (id: string | null) => {
    if (selectedProp === undefined) setOwn(id);
    onSelect?.(id);
  };

  // Roving tabindex: exactly one item has tabIndex 0. It's the last item the user
  // moved to; before that, the selection; before that, the first facility.
  const [activeId, setActiveId] = useState<string | null>(null);
  const exists = (id: string | null): id is string =>
    id !== null &&
    (facilitiesById.has(id) || network.segments.some((s) => s.id === id));
  const tabStopId = exists(activeId)
    ? activeId
    : exists(selectedId)
      ? selectedId
      : (network.facilities[0]?.id ?? null);

  /** Moves DOM focus to an item; its onFocus then makes it the tab stop. */
  const focusItem = (id: string | null) => {
    if (!id) return;
    svgRef.current
      ?.querySelector<SVGGElement>(`[data-map-item="${CSS.escape(id)}"]`)
      ?.focus();
  };

  return (
    <MapContext.Provider
      value={{
        network,
        facilitiesById,
        products,
        unitsPerPx,
        selectedId,
        select,
        tabStopId,
        setActiveId,
      }}
    >
      <svg
        ref={svgRef}
        role="group"
        {...props}
        viewBox={viewBox}
        className={cn('block h-auto w-full bg-bg', className)}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          const from = (e.target as Element).closest('[data-map-item]');
          const currentId = from?.getAttribute('data-map-item') ?? null;
          if (isArrowKey(e.key) && currentId) {
            e.preventDefault(); // don't scroll the page
            focusItem(nextInDirection(currentId, e.key, network));
          } else if (e.key === 'Home' || e.key === 'End') {
            e.preventDefault();
            const list = network.facilities;
            focusItem((e.key === 'Home' ? list[0] : list.at(-1))?.id ?? null);
          } else if (e.key === 'Escape' && selectedId !== null) {
            select(null);
          }
        }}
      >
        {children ?? (
          <>
            <PipelineMapSegments />
            <PipelineMapFacilities />
          </>
        )}
      </svg>
    </MapContext.Provider>
  );
}

/* ---------- Layers ---------- */

/** px of band left empty next to each facility, so batches stop short of the marker. */
const TRAIN_INSET_PX = 16;

function SegmentItem({
  segment,
  points,
}: {
  segment: Segment;
  points: Point[];
}) {
  const {
    facilitiesById,
    products,
    unitsPerPx,
    selectedId,
    select,
    tabStopId,
    setActiveId,
  } = useMap('PipelineMapSegments');
  const selected = selectedId === segment.id;
  const ref = useRef<SVGGElement>(null);
  const { pressProps } = usePress({ ref, onPress: () => select(segment.id) });
  const d = toPathData(points);
  const pipeWidth = strokeWidthFor(segment.flowRate, segment.maxFlowRate);
  return (
    <Tooltip
      content={
        <SegmentDetails segment={segment} facilitiesById={facilitiesById} />
      }
      size="md"
      delay={400}
    >
      <g
        ref={ref}
        {...pressProps}
        role="button"
        tabIndex={tabStopId === segment.id ? 0 : -1}
        onFocus={() => setActiveId(segment.id)}
        data-map-item={segment.id}
        aria-label={segmentLabel(segment, facilitiesById)}
        aria-pressed={selected}
        data-segment-id={segment.id}
        data-selected={selected || undefined}
        className="group cursor-pointer outline-hidden"
      >
        {/* A wide invisible stroke: an easier target than a 2px line. */}
        <path
          d={d}
          fill="none"
          vectorEffect="non-scaling-stroke"
          className="stroke-transparent [pointer-events:stroke] [stroke-width:20px]"
        />
        {/* Focused: a hollow ring (focus color, then a page-colored gap inside it).
          Selected: a filled primary halo. Filled vs hollow keeps them apart even
          where both are yellow (dark theme). */}
        <g
          className="opacity-0 group-focus-visible:opacity-100"
          data-focus-ring=""
        >
          <path
            d={d}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={pipeWidth + 18}
            className="stroke-focus-ring [stroke-linecap:round] [stroke-linejoin:round]"
          />
          <path
            d={d}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={pipeWidth + 14}
            className="stroke-bg [stroke-linecap:round] [stroke-linejoin:round]"
          />
        </g>
        {selected && (
          <path
            d={d}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={pipeWidth + 8}
            data-selection-halo=""
            className="stroke-primary [stroke-linecap:round] [stroke-linejoin:round]"
          />
        )}
        <PipeSegment
          d={d}
          status={segment.status}
          flowRate={segment.flowRate}
          maxFlowRate={segment.maxFlowRate}
        />
        <BatchTrain
          points={points}
          batches={segment.batches}
          products={products}
          unitsPerPx={unitsPerPx}
          insetPx={TRAIN_INSET_PX}
        />
      </g>
    </Tooltip>
  );
}

/** Draws every pipe with its batch band. A segment whose facility is missing is skipped. */
export function PipelineMapSegments() {
  const { network, facilitiesById } = useMap('PipelineMapSegments');
  return (
    <g data-layer="segments">
      {network.segments.map((segment) => {
        const points = segmentPoints(segment, facilitiesById);
        return points ? (
          <SegmentItem key={segment.id} segment={segment} points={points} />
        ) : null;
      })}
    </g>
  );
}

function FacilityItem({ facility }: { facility: Facility }) {
  const { unitsPerPx, selectedId, select, tabStopId, setActiveId } = useMap(
    'PipelineMapFacilities',
  );
  const selected = selectedId === facility.id;
  const ref = useRef<SVGGElement>(null);
  const { pressProps } = usePress({ ref, onPress: () => select(facility.id) });
  return (
    <Tooltip
      content={<FacilityDetails facility={facility} />}
      size="md"
      delay={400}
    >
      <FacilityNode
        ref={ref}
        {...pressProps}
        role="button"
        tabIndex={tabStopId === facility.id ? 0 : -1}
        onFocus={() => setActiveId(facility.id)}
        data-map-item={facility.id}
        aria-pressed={selected}
        data-facility-id={facility.id}
        className="cursor-pointer"
        position={facility.position}
        unitsPerPx={unitsPerPx}
        label={facility.label}
        kind={facility.kind}
        alert={facility.alert}
        tanks={facility.tanks}
        selected={selected}
      />
    </Tooltip>
  );
}

/** Draws every facility. Put it after `PipelineMapSegments` so markers cover pipe ends. */
export function PipelineMapFacilities() {
  const { network } = useMap('PipelineMapFacilities');
  return (
    <g data-layer="facilities">
      {network.facilities.map((facility) => (
        <FacilityItem key={facility.id} facility={facility} />
      ))}
    </g>
  );
}
