import {
  createContext,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react';
import { usePress } from 'react-aria';
import { cn } from '../../utils/cn';
import { Tooltip } from '../tooltip/tooltip';
import { BatchTrain } from './batch-train';
import { FacilityNode, facilityLabel } from './facility-node';
import { PipeSegment } from './pipe-segment';
import {
  batchSummary,
  findBatch,
  nextBatchInSegment,
  type BatchLocation,
} from './pipeline-batch';
import {
  batchMatches,
  filterSummary,
  isFilterActive,
  segmentMatches,
  type MapFilter,
} from './pipeline-filter';
import { isArrowKey, nextInDirection } from './pipeline-navigation';
import {
  traceNetwork,
  traceRole,
  traceSummary,
  type Trace,
  type TraceRole,
} from './pipeline-trace';
import { tankFill } from './tank-gauge';
import { segmentPoints, strokeWidthFor, toPathData } from './pipeline-geometry';
import type {
  Batch,
  Facility,
  PipelineNetwork,
  Point,
  Segment,
} from './pipeline-model';

/* ---------- Pure helpers (exported for tests) ---------- */

/** Space around the network for labels, badges and gauges, in px. */
export const MAP_PADDING = { x: 64, top: 36, bottom: 76 };

/** Extra room for a label beside an edge marker (`left`/`right`) or on top (`above`), in px. */
const SIDE_LABEL_PADDING = 150;
const TOP_LABEL_PADDING = 60;

export type MapPadding = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/**
 * Padding per side, in px. Widens a side only when a facility on that edge puts its
 * label out that way, so most maps keep the default and don't shrink for nothing.
 */
export function mapPadding(network: PipelineNetwork): MapPadding {
  const b = networkBounds(network);
  const onEdge = (side: 'left' | 'right' | 'above') =>
    network.facilities.some((f) => {
      if (f.labelPlacement !== side) return false;
      if (side === 'left') return f.position.x === b.minX;
      if (side === 'right') return f.position.x === b.maxX;
      return f.position.y === b.minY;
    });
  return {
    left: onEdge('left') ? SIDE_LABEL_PADDING : MAP_PADDING.x,
    right: onEdge('right') ? SIDE_LABEL_PADDING : MAP_PADDING.x,
    top: onEdge('above') ? TOP_LABEL_PADDING : MAP_PADDING.top,
    bottom: MAP_PADDING.bottom,
  };
}

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
 * `viewBoxWidth = span + (left + right)·unitsPerPx` with
 * `unitsPerPx = viewBoxWidth / widthPx` gives `unitsPerPx = span / (widthPx − left − right)`.
 */
export function mapLayout(
  network: PipelineNetwork,
  widthPx: number,
  padding: MapPadding = mapPadding(network),
) {
  const b = networkBounds(network);
  const span = Math.max(b.maxX - b.minX, 1);
  const usable = Math.max(widthPx - padding.left - padding.right, 1);
  const unitsPerPx = span / usable;
  const x = b.minX - padding.left * unitsPerPx;
  const y = b.minY - padding.top * unitsPerPx;
  const width = span + (padding.left + padding.right) * unitsPerPx;
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

/** A pipe's short name, "Station B to Station C". */
function routeName(
  segment: Segment,
  facilitiesById: ReadonlyMap<string, Facility>,
): string {
  const from = facilitiesById.get(segment.from)?.label ?? segment.from;
  const to = facilitiesById.get(segment.to)?.label ?? segment.to;
  return `${from} to ${to}`;
}

/** Added to an item's accessible name while a trace is on, so arrowing through says where it sits. */
const TRACE_WORDS: Record<TraceRole, string> = {
  origin: 'trace start',
  upstream: 'upstream',
  downstream: 'downstream',
};

/**
 * Faded while outside a trace: lower opacity is a contrast change, not a color, so it
 * reads in grayscale too. A focused item stays at full strength, so the focus ring is
 * never faint.
 */
const DIMMED =
  'transition-opacity motion-reduce:transition-none data-dimmed:not-focus-visible:opacity-25';

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
  /** The current trace, or `null`. Items outside it are dimmed. */
  trace: Trace | null;
  /** The legend filter. Pipes and batches that don't match are dimmed. */
  filter: MapFilter | undefined;
  /** The followed batch, or `null`. Pipes without it, and every other batch, are dimmed. */
  followed: BatchLocation | null;
  /** Follows a batch by name (`null` stops). */
  follow: (name: string | null) => void;
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

/**
 * What you can do to a map from outside it, through its `ref`. For things a prop
 * can't express: moving focus is an *action* at a moment, not a state to hold.
 *
 * @example
 * const mapRef = useRef<PipelineMapHandle>(null);
 * <PipelineMap ref={mapRef} … />
 * mapRef.current?.focusItem('D');
 */
export interface PipelineMapHandle {
  /**
   * Moves keyboard focus to a facility or pipe (it becomes the map's tab stop and
   * shows its tooltip). Returns `false` if no item has that id.
   */
  focusItem: (id: string) => boolean;
}

export type PipelineMapProps = Omit<
  ComponentProps<'svg'>,
  // `filter` is also a native SVG attribute (a string naming an SVG filter effect):
  // ours replaces it, so TypeScript doesn't merge the two into `string & MapFilter`.
  'children' | 'onSelect' | 'viewBox' | 'filter' | 'ref'
> & {
  /**
   * Gives you a `PipelineMapHandle` (not the `<svg>` element) to move focus from
   * outside, e.g. from `PipelineMapSearch`.
   */
  ref?: Ref<PipelineMapHandle>;
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
   * The facility or pipe being traced (controlled). Everything upstream and downstream
   * of it stays bright; the rest fades. `null` = no trace.
   * Separate from selection: you can trace one thing and select another.
   */
  tracedId?: string | null;
  /** The starting trace when uncontrolled. */
  defaultTracedId?: string | null;
  /** Called when the user starts a trace (`T` on an item) or clears it (`T` again, or Escape). */
  onTraceChange?: (id: string | null) => void;
  /**
   * Brings some products and pipe statuses forward; everything else fades (never
   * hidden). Usually set by `MapLegend`'s toggles: keep the filter in page state and
   * pass it to both. Combines with a trace: an item stays bright only if it is in the
   * trace **and** matches the filter.
   */
  filter?: MapFilter;
  /**
   * The batch being followed, by name (controlled). Pipes it's in stay bright and
   * every other batch fades, so you can see one batch across the stations it spans.
   * `null` = none.
   */
  followedBatch?: string | null;
  /** The starting followed batch when uncontrolled. */
  defaultFollowedBatch?: string | null;
  /**
   * Called when the user follows a batch (click its band, or `B` on a pipe to cycle
   * through that pipe's batches) or stops (the last `B`, a second click, or Escape).
   */
  onFollowBatchChange?: (name: string | null) => void;
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
 * last facility, Enter/Space select, `T` traces the flow through the focused item
 * (again to stop), Escape clears. Click works too. Hovering or
 * focusing an item shows its details (batches, tank levels) in a tooltip, which is
 * also its screen-reader description.
 *
 * Escape does one thing at a time: if a tooltip is open, it only closes the tooltip
 * (React Aria catches that Escape on the document, before it reaches the map); the
 * next clears the trace, and the one after that clears the selection.
 *
 * A polite live region announces a trace ("Tracing from Station C. Upstream: …").
 *
 * Facility and segment ids must be unique across both lists.
 */
export function PipelineMap({
  network,
  products,
  selectedId: selectedProp,
  defaultSelectedId = null,
  onSelect,
  tracedId: tracedProp,
  defaultTracedId = null,
  onTraceChange,
  filter,
  followedBatch: followedProp,
  defaultFollowedBatch = null,
  onFollowBatchChange,
  ref,
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

  // The trace: same controlled/uncontrolled pattern as selection.
  const [ownTrace, setOwnTrace] = useState<string | null>(defaultTracedId);
  const tracedId = tracedProp !== undefined ? tracedProp : ownTrace;
  const setTraced = (id: string | null) => {
    if (tracedProp === undefined) setOwnTrace(id);
    onTraceChange?.(id);
  };
  const trace = useMemo(
    () => (tracedId === null ? null : traceNetwork(network, tracedId)),
    [network, tracedId],
  );

  // The followed batch: the same controlled/uncontrolled pattern, a third time.
  const [ownFollowed, setOwnFollowed] = useState<string | null>(
    defaultFollowedBatch,
  );
  const followedName = followedProp !== undefined ? followedProp : ownFollowed;
  const follow = (name: string | null) => {
    if (followedProp === undefined) setOwnFollowed(name);
    onFollowBatchChange?.(name);
  };
  const followed = useMemo(
    () => (followedName === null ? null : findBatch(network, followedName)),
    [network, followedName],
  );

  // Announce trace changes (not the first render: nothing changed yet).
  const [announcement, setAnnouncement] = useState('');
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!trace) {
      setAnnouncement('Trace cleared.');
      return;
    }
    const segment = network.segments.find((s) => s.id === trace.origin);
    const name = segment
      ? routeName(segment, facilitiesById)
      : (facilitiesById.get(trace.origin)?.label ?? trace.origin);
    setAnnouncement(traceSummary(trace, network, name));
    // Keyed on the origin only: a new trace speaks, a data refresh doesn't.
  }, [trace?.origin]);

  // Announce following. The ref remembers the last name, to say what stopped.
  const lastFollowed = useRef<string | null>(followedName);
  useEffect(() => {
    const previous = lastFollowed.current;
    lastFollowed.current = followedName;
    if (previous === followedName) return; // first render, or no change
    setAnnouncement(
      followed ? batchSummary(followed) : `Stopped following ${previous}.`,
    );
  }, [followedName]);

  // Announce filter changes too: the legend says "SYN, pressed", this says what it did.
  const filterKey = JSON.stringify(filter ?? {});
  const firstFilter = useRef(true);
  useEffect(() => {
    if (firstFilter.current) {
      firstFilter.current = false;
      return;
    }
    setAnnouncement(filterSummary(network, filter));
    // Keyed on the filter's contents, not its object identity (a new {} each render).
  }, [filterKey]);

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
  const focusItem = (id: string | null): boolean => {
    if (!id) return false;
    const item = svgRef.current?.querySelector<SVGGElement>(
      `[data-map-item="${CSS.escape(id)}"]`,
    );
    item?.focus();
    return Boolean(item);
  };
  // The parent's ref gets this object instead of the <svg>. React 19: `ref` is a
  // plain prop on function components, so no forwardRef is needed.
  useImperativeHandle(ref, () => ({ focusItem }));

  return (
    <MapContext.Provider
      value={{
        network,
        facilitiesById,
        products,
        unitsPerPx,
        selectedId,
        select,
        trace,
        filter,
        followed,
        follow,
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
          } else if (
            (e.key === 'b' || e.key === 'B') &&
            currentId &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
          ) {
            // On a pipe: follow its next batch (and stop after the last one).
            if (network.segments.some((s) => s.id === currentId)) {
              follow(nextBatchInSegment(network, currentId, followedName));
            }
          } else if ((e.key === 't' || e.key === 'T') && currentId) {
            if (e.ctrlKey || e.metaKey || e.altKey) return; // leave shortcuts alone
            setTraced(tracedId === currentId ? null : currentId);
          } else if (e.key === 'Escape' && followedName !== null) {
            follow(null); // the narrowest thing first: one batch…
          } else if (e.key === 'Escape' && tracedId !== null) {
            setTraced(null);
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
      {/* Outside the svg: a live region inside role="group" svg is less reliable. */}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
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
    trace,
    filter,
    followed,
    follow,
    tabStopId,
    setActiveId,
  } = useMap('PipelineMapSegments');
  const selected = selectedId === segment.id;
  const role = trace ? traceRole(trace, segment.id) : null;
  const filtering = isFilterActive(filter);
  // Bright only if in the trace (when there is one) AND matching the filter (when on).
  const holdsFollowed =
    followed !== null &&
    followed.parts.some((part) => part.segmentId === segment.id);
  const dimmed =
    (trace !== null && role === null) ||
    (filtering && !segmentMatches(segment, filter)) ||
    (followed !== null && !holdsFollowed);
  /** Inside a bright pipe: fade batches that miss the filter or aren't followed. */
  const batchDimmed = (b: Batch) =>
    (filtering && !batchMatches(b, filter)) ||
    (followed !== null && b.name !== followed.name);
  const label = [
    segmentLabel(segment, facilitiesById),
    role && TRACE_WORDS[role],
    holdsFollowed && `holds ${followed.name}`,
  ]
    .filter(Boolean)
    .join(', ');
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
        aria-label={label}
        aria-pressed={selected}
        data-segment-id={segment.id}
        data-selected={selected || undefined}
        data-trace={role ?? undefined}
        data-dimmed={dimmed || undefined}
        className={cn('group cursor-pointer outline-hidden', DIMMED)}
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
          // A bright pipe can still carry other products: fade just those batches.
          // (A dimmed pipe is already faded as a whole; fading twice would vanish.)
          isDimmed={
            (filtering || followed) && !dimmed ? batchDimmed : undefined
          }
          // Clicking a batch follows it (again to stop). The pipe is selected too.
          onBatchPress={(b) =>
            follow(followed?.name === b.name ? null : b.name)
          }
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
  const { unitsPerPx, selectedId, select, trace, tabStopId, setActiveId } =
    useMap('PipelineMapFacilities');
  const selected = selectedId === facility.id;
  const role = trace ? traceRole(trace, facility.id) : null;
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
        data-trace={role ?? undefined}
        data-dimmed={(trace && !role) || undefined}
        // Only while tracing: replaces the node's own name to add where it sits. Passing
        // `aria-label={undefined}` would erase the node's name (props spread over it).
        {...(role && {
          'aria-label': `${facilityLabel(facility)}, ${TRACE_WORDS[role]}`,
        })}
        className={cn('cursor-pointer', DIMMED)}
        position={facility.position}
        unitsPerPx={unitsPerPx}
        label={facility.label}
        kind={facility.kind}
        alert={facility.alert}
        tanks={facility.tanks}
        labelPlacement={facility.labelPlacement}
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
