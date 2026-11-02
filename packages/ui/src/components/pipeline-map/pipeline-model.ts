/*
 * The data a Pipeline Map draws. Types only: no backend, no fetching.
 * Any app (Spring, .NET, Node) maps its own response into this shape.
 *
 * Units: volumes in m³, flow rates in m³/h, positions in schematic grid units
 * (not pixels and not latitude/longitude; the map scales the grid to fit).
 */

/** What a facility is. Picks the icon on its node. */
export type FacilityKind = 'terminal' | 'pump-station' | 'tank-farm' | 'refinery';

/**
 * How a segment is running. Drawn with color **and** a dash pattern, never color alone.
 * - `running`: normal flow
 * - `restricted`: flowing, but below its normal limit
 * - `shutdown`: no flow
 */
export type SegmentStatus = 'running' | 'restricted' | 'shutdown';

/** A position on the schematic grid. `y` grows downward, like SVG. */
export interface Point {
  x: number;
  y: number;
}

/** One tank at a facility. */
export interface Tank {
  id: string;
  label: string;
  /** Volume in the tank now, in m³. */
  volume: number;
  /** Most the tank can hold, in m³. */
  capacity: number;
}

/** A place on the network: a terminal, pump station, tank farm or refinery. */
export interface Facility {
  /** Unique id. Segments refer to facilities by this id. */
  id: string;
  label: string;
  kind: FacilityKind;
  /** Where the node sits on the schematic grid. Placed by hand in v1 (no auto-layout). */
  position: Point;
  tanks?: Tank[];
  /** A problem to flag on the node. */
  alert?: { level: 'warning' | 'danger'; message: string };
}

/** A batch: one product moving through a segment as a single slug. */
export interface Batch {
  /** Stable identity (the batch name). Unique within a segment. */
  name: string;
  /** Product code. Maps to a product color token (`--fds-product-*`). */
  product: string;
  /** Volume of this batch currently inside this segment, in m³. */
  volume: number;
}

/** A pipe between two facilities. Flow always goes `from` → `to`. */
export interface Segment {
  id: string;
  /** Upstream `Facility.id`. */
  from: string;
  /** Downstream `Facility.id`. */
  to: string;
  /** Corner points between `from` and `to`, in order. Omit for a straight line. */
  waypoints?: Point[];
  /** Current flow, in m³/h. */
  flowRate: number;
  /** The segment's normal maximum flow, in m³/h. Used to scale the line width. */
  maxFlowRate: number;
  status: SegmentStatus;
  /**
   * The batches in the pipe, **downstream-first**: `batches[0]` is the oldest batch,
   * the one closest to `to` (it will arrive first).
   */
  batches: Batch[];
}

/** Everything a map draws. */
export interface PipelineNetwork {
  facilities: Facility[];
  segments: Segment[];
}
