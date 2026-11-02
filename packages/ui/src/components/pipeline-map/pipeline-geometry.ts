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
  if (!points) return null;
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');
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
