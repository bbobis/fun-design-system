/*
 * Arrow-key navigation on a Pipeline Map. Pure functions, no React: easy to test.
 *
 * The map is a graph: facilities are joined by segments. An arrow key moves along it:
 *   facility --arrow--> the segment leaving in that direction
 *   segment  --arrow--> the facility at that end
 * so going from one facility to the next takes two presses, and the pipe in between
 * gets its turn (it's selectable too).
 */
import {
  polylineLength,
  segmentPoints,
  slicePolyline,
} from './pipeline-geometry';
import type { Facility, PipelineNetwork, Point } from './pipeline-model';

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/** Screen directions. SVG `y` grows downward, so up is −y. */
const DIRECTIONS: Record<ArrowKey, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

/** How far off the arrow a target may be: within 60° (cos 60° = 0.5). */
const MIN_ALIGNMENT = 0.5;

export function isArrowKey(key: string): key is ArrowKey {
  return key in DIRECTIONS;
}

/** cos of the angle between two vectors; 0 for a zero-length one. */
function alignment(v: Point, arrow: Point): number {
  const len = Math.hypot(v.x, v.y);
  return len === 0 ? 0 : (v.x * arrow.x + v.y * arrow.y) / len;
}

const minus = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });

/** A candidate to move to, and which way it lies from here. */
type Candidate = { id: string; direction: Point };

/**
 * Where an arrow key goes from `currentId` (a facility or segment id). `null` when
 * nothing lies within 60° of that direction, so focus stays put (no wrapping: on a
 * map, wrapping would jump somewhere unrelated).
 */
export function nextInDirection(
  currentId: string,
  key: ArrowKey,
  network: PipelineNetwork,
): string | null {
  const byId = new Map<string, Facility>(
    network.facilities.map((f) => [f.id, f]),
  );
  const candidates: Candidate[] = [];

  const facility = byId.get(currentId);
  if (facility) {
    // Each segment touching this facility, in the direction of its first leg away from it.
    for (const segment of network.segments) {
      const points = segmentPoints(segment, byId);
      if (!points) continue;
      if (segment.from === facility.id) {
        candidates.push({
          id: segment.id,
          direction: minus(points[1] as Point, points[0] as Point),
        });
      } else if (segment.to === facility.id) {
        const n = points.length;
        candidates.push({
          id: segment.id,
          direction: minus(points[n - 2] as Point, points[n - 1] as Point),
        });
      }
    }
  } else {
    const segment = network.segments.find((s) => s.id === currentId);
    const points = segment && segmentPoints(segment, byId);
    if (!segment || !points) return null;
    // From the middle of the pipe (by length) to each end, so an elbow points the
    // way you'd expect: its far end, not its first leg.
    const middle =
      polylineLength(points) > 0
        ? (slicePolyline(points, 0, 0.5).at(-1) as Point)
        : (points[0] as Point);
    candidates.push(
      { id: segment.from, direction: minus(points[0] as Point, middle) },
      { id: segment.to, direction: minus(points.at(-1) as Point, middle) },
    );
  }

  const arrow = DIRECTIONS[key];
  let best: { id: string; score: number } | null = null;
  for (const c of candidates) {
    const score = alignment(c.direction, arrow);
    if (score >= MIN_ALIGNMENT && (!best || score > best.score))
      best = { id: c.id, score };
  }
  return best?.id ?? null;
}
