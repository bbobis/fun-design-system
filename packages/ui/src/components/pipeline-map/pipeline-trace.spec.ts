import { DEMO_NETWORK } from './pipeline-map.fixtures';
import type { PipelineNetwork } from './pipeline-model';
import { traceNetwork, traceRole, traceSummary } from './pipeline-trace';

/*
 *   Terminal A ── Station B ── Station C ── Tank Farm D      (flow →)
 *                     │             │
 *                Terminal E         └───────── Refinery F
 */
/** The trace, or a failed test: keeps the assertions below free of `!`. */
function traceOf(id: string) {
  const t = traceNetwork(DEMO_NETWORK, id);
  if (!t) throw new Error(`no trace for ${id}`);
  return t;
}
const sorted = (ids: ReadonlySet<string> | undefined) =>
  [...(ids ?? [])].sort();

describe('traceNetwork', () => {
  it('from a facility: what feeds it, and everything it feeds', () => {
    const t = traceNetwork(DEMO_NETWORK, 'C');
    expect(t?.origin).toBe('C');
    expect(sorted(t?.upstream)).toEqual(['A', 'A-B', 'B', 'B-C']);
    expect(sorted(t?.downstream)).toEqual(['C-D', 'C-F', 'D', 'F']);
  });

  it('a branch off the upstream side is not part of the trace', () => {
    const t = traceNetwork(DEMO_NETWORK, 'C');
    // B also feeds E, but product going to E never reaches C.
    expect(t?.upstream.has('B-E')).toBe(false);
    expect(t?.downstream.has('E')).toBe(false);
  });

  it('from a pipe: upstream from its `from`, downstream from its `to`', () => {
    const t = traceNetwork(DEMO_NETWORK, 'B-C');
    expect(sorted(t?.upstream)).toEqual(['A', 'A-B', 'B']);
    expect(sorted(t?.downstream)).toEqual(['C', 'C-D', 'C-F', 'D', 'F']);
  });

  it('the source and the end of the line have an empty side', () => {
    expect(traceNetwork(DEMO_NETWORK, 'A')?.upstream.size).toBe(0);
    expect(traceNetwork(DEMO_NETWORK, 'D')?.downstream.size).toBe(0);
  });

  it('returns null for an unknown id', () => {
    expect(traceNetwork(DEMO_NETWORK, 'nope')).toBeNull();
  });

  it('stops on a loop instead of running forever', () => {
    const loop: PipelineNetwork = {
      facilities: ['X', 'Y', 'Z'].map((id, i) => ({
        id,
        label: id,
        kind: 'pump-station',
        position: { x: i, y: 0 },
      })),
      segments: [
        ['X', 'Y'],
        ['Y', 'Z'],
        ['Z', 'X'],
      ].map(([from, to]) => ({
        id: `${from}-${to}`,
        from: from as string,
        to: to as string,
        flowRate: 1,
        maxFlowRate: 1,
        status: 'running' as const,
        batches: [],
      })),
    };
    const t = traceNetwork(loop, 'X-Y');
    expect(sorted(t?.downstream)).toEqual(['X', 'Y', 'Y-Z', 'Z', 'Z-X']);
    expect(t?.downstream.has('X-Y')).toBe(false); // the origin is never its own downstream
  });
});

describe('traceRole', () => {
  it('says where an item sits, or null when it is outside (dimmed)', () => {
    const t = traceOf('C');
    expect(traceRole(t, 'C')).toBe('origin');
    expect(traceRole(t, 'A-B')).toBe('upstream');
    expect(traceRole(t, 'F')).toBe('downstream');
    expect(traceRole(t, 'E')).toBeNull();
  });
});

describe('traceSummary', () => {
  it('counts pipes and facilities on each side', () => {
    const t = traceOf('C');
    expect(traceSummary(t, DEMO_NETWORK, 'Station C')).toBe(
      'Tracing from Station C. Upstream: 2 pipes, 2 facilities. Downstream: 2 pipes, 2 facilities.',
    );
  });

  it('says "nothing" for an empty side, and uses singulars', () => {
    const t = traceOf('E');
    expect(traceSummary(t, DEMO_NETWORK, 'Terminal E')).toBe(
      'Tracing from Terminal E. Upstream: 2 pipes, 2 facilities. Downstream: nothing.',
    );
    const tb = traceOf('B-E');
    expect(traceSummary(tb, DEMO_NETWORK, 'Station B to Terminal E')).toBe(
      'Tracing from Station B to Terminal E. Upstream: 1 pipe, 2 facilities. Downstream: 0 pipes, 1 facility.',
    );
  });
});
