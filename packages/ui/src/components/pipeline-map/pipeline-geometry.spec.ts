import {
  batchOffsets,
  segmentPath,
  segmentPoints,
  strokeWidthFor,
} from './pipeline-geometry';
import type { Batch, Facility, Segment } from './pipeline-model';

const facility = (id: string, x: number, y: number): Facility => ({
  id,
  label: id,
  kind: 'pump-station',
  position: { x, y },
});
const byId = new Map(
  [facility('a', 0, 0), facility('b', 4, 0), facility('c', 4, 3)].map((f) => [
    f.id,
    f,
  ]),
);
const segment = (over: Partial<Segment> = {}): Segment => ({
  id: 's1',
  from: 'a',
  to: 'b',
  flowRate: 600,
  maxFlowRate: 1200,
  status: 'running',
  batches: [],
  ...over,
});
const batch = (name: string, volume: number): Batch => ({
  name,
  product: 'SYN',
  volume,
});
/** `{ name: [start, length] }`, rounded so float noise doesn't fail the test. */
const spans = (batches: Batch[]) =>
  Object.fromEntries(
    batchOffsets(batches).map((s) => [
      s.batch.name,
      [+s.start.toFixed(6), +s.length.toFixed(6)],
    ]),
  );

describe('pipeline-geometry', () => {
  describe('segmentPath', () => {
    it('draws a straight line from the upstream to the downstream facility', () => {
      expect(segmentPath(segment(), byId)).toBe('M 0 0 L 4 0');
    });

    it('passes through waypoints in order, so an elbow is one waypoint', () => {
      expect(
        segmentPath(segment({ to: 'c', waypoints: [{ x: 4, y: 0 }] }), byId),
      ).toBe('M 0 0 L 4 0 L 4 3');
    });

    it('gives null, not a line to (0, 0), when a facility is missing', () => {
      expect(segmentPath(segment({ to: 'nope' }), byId)).toBeNull();
      expect(segmentPoints(segment({ from: 'nope' }), byId)).toBeNull();
    });
  });

  describe('strokeWidthFor', () => {
    it('scales linearly from min (no flow) to max (full flow)', () => {
      expect(strokeWidthFor(0, 1200)).toBe(2);
      expect(strokeWidthFor(600, 1200)).toBe(6);
      expect(strokeWidthFor(1200, 1200)).toBe(10);
    });

    it('caps flow above the maximum and floors negative flow', () => {
      expect(strokeWidthFor(5000, 1200)).toBe(10);
      expect(strokeWidthFor(-50, 1200)).toBe(2);
    });

    it('falls back to min for a zero/missing maximum or a non-number', () => {
      expect(strokeWidthFor(600, 0)).toBe(2);
      expect(strokeWidthFor(600, Number.NaN)).toBe(2);
      expect(strokeWidthFor(Number.NaN, 1200)).toBe(2);
    });

    it('takes a custom range', () => {
      expect(strokeWidthFor(600, 1200, { min: 1, max: 3 })).toBe(2);
    });
  });

  describe('batchOffsets', () => {
    it('puts batches[0] (downstream-first) at the downstream end of the pipe', () => {
      // 1,000 m³ of linefill: A (oldest) 500, B 300, C (newest) 200.
      expect(
        spans([batch('A', 500), batch('B', 300), batch('C', 200)]),
      ).toEqual({
        A: [0.5, 0.5], // ends at 1, the `to` end
        B: [0.2, 0.3],
        C: [0, 0.2], // starts at 0, the `from` end
      });
    });

    it('fills the whole pipe: lengths add up to 1 and the batches touch', () => {
      const result = batchOffsets([
        batch('A', 1),
        batch('B', 2),
        batch('C', 7),
      ]);
      expect(result.reduce((sum, s) => sum + s.length, 0)).toBeCloseTo(1);
      for (let i = 1; i < result.length; i++) {
        const downstream = result[i - 1];
        const upstream = result[i];
        expect(upstream?.start ?? NaN).toBeCloseTo(
          (downstream?.start ?? NaN) - (upstream?.length ?? NaN),
        );
      }
    });

    it('one batch fills the pipe', () => {
      expect(spans([batch('A', 42)])).toEqual({ A: [0, 1] });
    });

    it('leaves out batches with no (or bad) volume, keeping the order', () => {
      expect(
        Object.keys(
          spans([
            batch('A', 100),
            batch('empty', 0),
            batch('neg', -5),
            batch('nan', Number.NaN),
            batch('B', 100),
          ]),
        ),
      ).toEqual(['A', 'B']);
    });

    it('gives nothing to draw for an empty pipe', () => {
      expect(batchOffsets([])).toEqual([]);
      expect(batchOffsets([batch('empty', 0)])).toEqual([]);
    });

    it('never starts a batch before the pipe (float rounding)', () => {
      const thirds = batchOffsets([
        batch('A', 1),
        batch('B', 1),
        batch('C', 1),
      ]);
      expect(thirds.at(-1)?.start).toBe(0);
    });
  });
});
