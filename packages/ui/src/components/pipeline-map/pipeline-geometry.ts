/*
 * Geometry for the Pipeline Map. Pure functions, no React: easy to test.
 *
 * Everything here works in schematic grid units or in fractions (0–1) of a pipe's
 * length. Turning grid units into pixels is the SVG `viewBox`'s job, not ours.
 */
import type { Batch, Facility, Point, Segment } from './pipeline-model';

/**
 * The points a segment's line passes through: the `from` facility, the waypoints,
 * then the `to` facility. `null` if either facility is missing, so the map can skip
 * the segment instead of drawing a line to (0, 0).
 */
export function segmentPoints(
  segment: Segment,
  facilitiesById: ReadonlyMap<string, Facility>,
): Point[] | null {
  const from = facilitiesById.get(segment.from);
  const to = facilitiesById.get(segment.to);
  if (!from || !to) return null;
  return [from.position, ...(segment.waypoints ?? []), to.position];
}

/**
 * SVG path data for a segment: `'M 0 0 L 4 0 L 4 3'`. Straight lines between points,
 * so an elbow is just a waypoint. `null` if a facility is missing.
 */
export function segmentPath(
  segment: Segment,
  facilitiesById: ReadonlyMap<string, Facility>,
): string | null {
  const points = segmentPoints(segment, facilitiesById);
  return points ? toPathData(points) : null;
}

/** SVG path data for a polyline: `'M 0 0 L 4 0'`. Empty for no points. */
export function toPathData(points: readonly Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

/** Total length of a polyline, in its own units. */
export function polylineLength(points: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

/**
 * A copy of a polyline moved sideways by `distance`, to the **left of the direction
 * of travel** (for a pipe drawn left to right, that is above it; SVG `y` grows down).
 * Corners are mitred, so a right-angle elbow stays a right angle.
 * Zero-length legs are skipped. Fewer than two distinct points → the input unchanged.
 */
export function offsetPolyline(
  points: readonly Point[],
  distance: number,
): Point[] {
  const pts = points.filter(
    (p, i) => i === 0 || p.x !== points[i - 1]?.x || p.y !== points[i - 1]?.y,
  );
  if (pts.length < 2 || distance === 0) return [...pts];

  // Left-hand unit normal of each leg: direction (dx, dy) → (dy, -dx).
  const normals = pts.slice(1).map((b, i) => {
    const a = pts[i] as Point;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    return { x: (b.y - a.y) / len, y: -(b.x - a.x) / len };
  });

  return pts.map((p, i) => {
    const before = normals[i - 1];
    const after = normals[i];
    if (!before || !after) {
      const n = (before ?? after) as Point;
      return { x: p.x + n.x * distance, y: p.y + n.y * distance };
    }
    // Mitre: push along the average normal, scaled so each leg stays `distance` away.
    const k = distance / (1 + before.x * after.x + before.y * after.y);
    return {
      x: p.x + (before.x + after.x) * k,
      y: p.y + (before.y + after.y) * k,
    };
  });
}

/**
 * The piece of a polyline between two fractions of its **length** (0 = first point,
 * 1 = last point). Corners inside the piece are kept, so a slice across an elbow
 * still turns the corner.
 *
 * This is how batches are drawn: one sub-path per `batchOffsets` span. (Dashes with
 * `pathLength` would be simpler, but they break with `non-scaling-stroke`.)
 *
 * Fractions are clamped to 0–1. Gives `[]` when there is nothing to draw: fewer than
 * two points, a zero-length line, or `end <= start`.
 */
export function slicePolyline(
  points: readonly Point[],
  start: number,
  end: number,
): Point[] {
  const from = Math.min(Math.max(start, 0), 1);
  const to = Math.min(Math.max(end, 0), 1);
  if (points.length < 2 || to <= from) return [];

  // Distance from the first point to each point.
  const at: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    at.push((at[i - 1] as number) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = at[at.length - 1] as number;
  if (total === 0) return [];

  /** The point `d` along the line, by walking to the leg that contains it. */
  const pointAt = (d: number): Point => {
    let i = 1;
    while (i < points.length - 1 && (at[i] as number) < d) i++;
    const a = points[i - 1] as Point;
    const b = points[i] as Point;
    const legStart = at[i - 1] as number;
    const leg = (at[i] as number) - legStart;
    const t = leg === 0 ? 0 : (d - legStart) / leg;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  const startD = from * total;
  const endD = to * total;
  const corners = points.filter((_, i) => {
    const d = at[i] as number;
    return d > startD && d < endD;
  });
  return [pointAt(startD), ...corners, pointAt(endD)];
}

/**
 * Thinnest and thickest pipe line, in the unit the map draws strokes in
 * (screen pixels if strokes don't scale with the map, see `PipeSegment`).
 */
export type StrokeRange = { min: number; max: number };

/** Default line widths: a shut-down pipe is still visible, a full one isn't a blob. */
export const DEFAULT_STROKE_RANGE: StrokeRange = { min: 2, max: 10 };

/**
 * Line width for a flow rate: `flowRate / maxFlowRate`, scaled into `range`.
 * Zero flow gets `range.min` (the pipe stays visible); flow above the maximum is
 * capped at `range.max`. A missing or zero maximum, or a non-number, gives `range.min`.
 */
export function strokeWidthFor(
  flowRate: number,
  maxFlowRate: number,
  range: StrokeRange = DEFAULT_STROKE_RANGE,
): number {
  if (!(maxFlowRate > 0) || !Number.isFinite(flowRate)) return range.min;
  const ratio = Math.min(Math.max(flowRate / maxFlowRate, 0), 1);
  return range.min + ratio * (range.max - range.min);
}

/** Where one batch sits along its pipe, as fractions of the pipe's length. */
export type BatchSpan = {
  batch: Batch;
  /** Distance from the `from` (upstream) end to the batch's upstream edge, 0–1. */
  start: number;
  /** The batch's share of the pipe, 0–1. */
  length: number;
};

/**
 * Lay batches end to end along a pipe. A pipeline is always full, so each batch's
 * length is its share of the total volume in the segment (the linefill).
 *
 * `batches` are **downstream-first** (`batches[0]` is nearest `to`), but offsets are
 * measured from `from`. So the walk starts at the far end (1) and moves upstream:
 * `batches[0]` ends at 1, the last batch starts at 0.
 *
 * Batches with no volume (or a negative or non-number volume) take no space and are
 * left out. Spans come back in the same order as `batches`.
 */
export function batchOffsets(batches: readonly Batch[]): BatchSpan[] {
  const sized = batches
    .map((batch) => ({
      batch,
      volume: Number.isFinite(batch.volume) ? Math.max(batch.volume, 0) : 0,
    }))
    .filter((b) => b.volume > 0);
  const total = sized.reduce((sum, b) => sum + b.volume, 0);

  let cursor = 1; // the downstream end
  return sized.map(({ batch, volume }, i) => {
    const length = volume / total;
    cursor -= length;
    // Float rounding leaves the last start near 0 (±1e-16), not at 0. Snap it,
    // so the newest batch starts exactly at the upstream end.
    const isLast = i === sized.length - 1;
    return { batch, start: isLast ? 0 : Math.max(cursor, 0), length };
  });
}
