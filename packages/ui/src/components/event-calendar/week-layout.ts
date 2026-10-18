/*
 * Where timed events go in the week view. Pure functions, no React: easy to test.
 */

/** Blocks shorter than this are drawn at this length, so a title still fits. */
export const DEFAULT_MINUTES = 30;

/** `'09:30'` → 570 (minutes after midnight). Bad text → null. */
export function toMinutes(hhmm: string | undefined): number | null {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null;
  const [h, m] = hhmm.split(':').map(Number) as [number, number];
  return h < 24 && m < 60 ? h * 60 + m : null;
}

export type Timed<T> = { item: T; start: number; end: number };

/**
 * Start and end in minutes. A missing or bad end, or one not after the start, gives
 * a `DEFAULT_MINUTES` block; nothing runs past midnight (one day per column).
 */
export function toTimed<T>(
  item: T,
  time: string | undefined,
  endTime: string | undefined,
): Timed<T> | null {
  const start = toMinutes(time);
  if (start === null) return null;
  const end = toMinutes(endTime);
  return {
    item,
    start,
    end: Math.min(
      end !== null && end > start ? end : start + DEFAULT_MINUTES,
      24 * 60,
    ),
  };
}

export type Placed<T> = Timed<T> & {
  /** Which column inside its group, from 0. */
  lane: number;
  /** How many columns its group needs. Width = 1 / lanes. */
  lanes: number;
};

/**
 * Side-by-side layout for overlapping events (the usual calendar approach):
 * 1. Sort by start (longer first on ties).
 * 2. Walk them, building **clusters**: events joined by overlaps, even through a
 *    middle one (A overlaps B, B overlaps C → one cluster, even if A and C don't).
 * 3. In a cluster, give each event the first lane whose last event has ended.
 * 4. Every event in a cluster gets the cluster's lane count, so widths line up.
 */
export function layoutDay<T>(timed: readonly Timed<T>[]): Placed<T>[] {
  const sorted = [...timed].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const close = () => {
    for (const p of cluster) p.lanes = laneEnds.length;
    cluster = [];
    laneEnds = [];
  };

  for (const t of sorted) {
    if (t.start >= clusterEnd) close(); // nothing open overlaps: new cluster
    let lane = laneEnds.findIndex((end) => end <= t.start);
    if (lane === -1) lane = laneEnds.push(t.end) - 1;
    else laneEnds[lane] = t.end;
    const p = { ...t, lane, lanes: 1 };
    cluster.push(p);
    placed.push(p);
    clusterEnd = Math.max(clusterEnd, t.end);
  }
  close();
  return placed;
}

/** Moves and resizes snap to this many minutes. */
export const SNAP_MINUTES = 15;

/** 570 → `'09:30'`. */
export function fromMinutes(minutes: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** Round to the nearest `SNAP_MINUTES` (37 → 30, 38 → 45). */
export const snap = (minutes: number) =>
  Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;

export type Change = {
  /** Days to move (−1 = a day earlier). */
  days: number;
  /** Minutes to move the whole block (start and end). */
  move: number;
  /** Minutes to add to the end only (resize). */
  resize: number;
};

/**
 * Where a block ends up after a move or resize, kept inside the day (00:00–24:00)
 * and the visible week (day index 0–6), and never shorter than one snap step.
 */
export function applyChange(
  block: { start: number; end: number; dayIndex: number },
  change: Change,
): { start: number; end: number; dayIndex: number } {
  const length = block.end - block.start;
  const dayIndex = Math.min(6, Math.max(0, block.dayIndex + change.days));
  const start = Math.min(
    24 * 60 - SNAP_MINUTES,
    Math.max(0, block.start + change.move),
  );
  // A move keeps the length (shortened only at midnight); a resize changes the end.
  const end = Math.min(
    24 * 60,
    Math.max(start + SNAP_MINUTES, start + length + change.resize),
  );
  return { start, end, dayIndex };
}
