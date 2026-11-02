import { batchSummary, findBatch, nextBatchInSegment } from './pipeline-batch';
import { DEMO_NETWORK } from './pipeline-map.fixtures';

describe('findBatch', () => {
  it('finds a batch in every pipe it spans, by name', () => {
    expect(findBatch(DEMO_NETWORK, 'B-1041')).toEqual({
      name: 'B-1041',
      product: 'SYN',
      parts: [
        { segmentId: 'A-B', volume: 52_000 },
        { segmentId: 'B-C', volume: 44_000 },
      ],
      totalVolume: 96_000,
    });
  });

  it('a batch in one pipe has one part', () => {
    expect(findBatch(DEMO_NETWORK, 'B-1037')?.parts).toEqual([
      { segmentId: 'C-D', volume: 20_000 },
    ]);
  });

  it('returns null for a name no pipe holds', () => {
    expect(findBatch(DEMO_NETWORK, 'B-9999')).toBeNull();
  });
});

describe('nextBatchInSegment', () => {
  // A-B holds B-1041 then B-1042 (downstream first).
  const next = (current: string | null) =>
    nextBatchInSegment(DEMO_NETWORK, 'A-B', current);

  it('cycles through the pipe’s batches, then stops following', () => {
    expect(next(null)).toBe('B-1041');
    expect(next('B-1041')).toBe('B-1042');
    expect(next('B-1042')).toBeNull();
  });

  it('starts at the first batch when following one from another pipe', () => {
    expect(next('B-1037')).toBe('B-1041');
  });

  it('is null for a pipe with no batches or an unknown id', () => {
    expect(nextBatchInSegment(DEMO_NETWORK, 'nope', null)).toBeNull();
  });
});

describe('batchSummary', () => {
  it('says the total and how many pipes', () => {
    const spans = findBatch(DEMO_NETWORK, 'B-1041');
    const single = findBatch(DEMO_NETWORK, 'B-1037');
    if (!spans || !single) throw new Error('demo batches missing');
    expect(batchSummary(spans)).toBe(
      'Following B-1041, SYN: 96,000 m³ across 2 pipes.',
    );
    expect(batchSummary(single)).toBe(
      'Following B-1037, CON: 20,000 m³ in 1 pipe.',
    );
  });
});
