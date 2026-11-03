import { parseDate, toZoned } from '@internationalized/date';

/** One batch on the schedule: a product moving through one line over a time span. */
export interface ScheduledBatch {
  /** Unique id. */
  id: string;
  /** The batch name people use ("26-114"). */
  name: string;
  /** Product code ("SYN"). Its place in `products` picks the color, like the map. */
  product: string;
  /** `ScheduleLine.id` this batch belongs to. */
  line: string;
  /** Start, as an ISO 8601 date-time with a zone ("2026-11-03T06:00:00Z"). */
  start: string;
  /** End, ISO 8601 date-time. After `start`. */
  end: string;
  /** Volume in m³ (read out with the batch). */
  volume?: number;
  /** @default 'planned' */
  status?: BatchStatus;
}

export type BatchStatus = 'planned' | 'active' | 'complete' | 'at-risk';

/** A row of the schedule: a line, or a line segment ("Line 1 · A → B"). */
export interface ScheduleLine {
  id: string;
  label: string;
}

/**
 * The midnights that bound each day column, as epoch ms: `days + 1` numbers.
 *
 * Computed in `timeZone`, one calendar day at a time. Not `start + i × 24h`: days
 * aren't always 24 hours. When clocks go back (Nov 1, 2026 in North America) that
 * day is 25 hours long; when they go forward, 23.
 */
export function dayBoundaries(
  from: string,
  days: number,
  timeZone: string,
): number[] {
  const first = parseDate(from);
  return Array.from({ length: days + 1 }, (_, i) =>
    toZoned(first.add({ days: i }), timeZone)
      .toDate()
      .getTime(),
  );
}

export interface BarPosition {
  /** Left edge, in % of the window. */
  left: number;
  /** Width, in % of the window. */
  width: number;
  /** It starts before the window (draw a "continues" edge on the left). */
  cutStart: boolean;
  /** It ends after the window. */
  cutEnd: boolean;
}

/** Where a time span sits in the window, in %. `null` when it's entirely outside. */
export function barPosition(
  start: number,
  end: number,
  windowStart: number,
  windowEnd: number,
): BarPosition | null {
  if (end <= windowStart || start >= windowEnd) return null;
  const span = windowEnd - windowStart;
  const a = Math.max(start, windowStart);
  const b = Math.min(end, windowEnd);
  return {
    left: ((a - windowStart) / span) * 100,
    width: ((b - a) / span) * 100,
    cutStart: start < windowStart,
    cutEnd: end > windowEnd,
  };
}

/**
 * Puts overlapping batches of one line on separate lanes, so no bar hides another.
 * Greedy: sort by start, put each batch on the first lane that's free by then.
 * Returns lane per batch id, plus the number of lanes the line needs.
 */
export function assignLanes(batches: readonly ScheduledBatch[]): {
  lanes: Map<string, number>;
  count: number;
} {
  const sorted = [...batches].sort(
    (x, y) => Date.parse(x.start) - Date.parse(y.start),
  );
  const laneEnds: number[] = []; // when each lane is free again
  const lanes = new Map<string, number>();
  for (const b of sorted) {
    const start = Date.parse(b.start);
    let lane = laneEnds.findIndex((free) => free <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = Date.parse(b.end);
    lanes.set(b.id, lane);
  }
  return { lanes, count: Math.max(1, laneEnds.length) };
}

/** Midpoint of a batch in epoch ms (for "closest in time" on the next line). */
const midpoint = (b: ScheduledBatch) =>
  (Date.parse(b.start) + Date.parse(b.end)) / 2;

export type Move = 'prev' | 'next' | 'up' | 'down' | 'first' | 'last';

/**
 * The batch keyboard focus goes to. `rows` are the lines in display order, each with
 * its batches sorted by start. Up / down skip empty lines and pick the batch closest
 * in time, so focus stays near the same moment while moving between lines.
 */
export function moveFocus(
  rows: readonly (readonly ScheduledBatch[])[],
  currentId: string,
  move: Move,
): string {
  const r = rows.findIndex((row) => row.some((b) => b.id === currentId));
  if (r === -1) return currentId;
  const row = rows[r] ?? [];
  const i = row.findIndex((b) => b.id === currentId);
  const current = row[i];
  if (!current) return currentId;

  if (move === 'prev') return row[Math.max(0, i - 1)]?.id ?? currentId;
  if (move === 'next')
    return row[Math.min(row.length - 1, i + 1)]?.id ?? currentId;
  if (move === 'first') return row[0]?.id ?? currentId;
  if (move === 'last') return row[row.length - 1]?.id ?? currentId;

  const step = move === 'up' ? -1 : 1;
  for (let j = r + step; j >= 0 && j < rows.length; j += step) {
    const other = rows[j] ?? [];
    if (other.length === 0) continue;
    const t = midpoint(current);
    let best = other[0] as ScheduledBatch;
    for (const b of other) {
      if (Math.abs(midpoint(b) - t) < Math.abs(midpoint(best) - t)) best = b;
    }
    return best.id;
  }
  return currentId;
}
