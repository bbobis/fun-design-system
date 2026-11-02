/*
 * "Trace the flow": what is upstream and downstream of one facility or pipe.
 * Pure functions, no React: easy to test.
 */
import type { PipelineNetwork } from './pipeline-model';

/** Where an item sits in a trace. */
export type TraceRole = 'origin' | 'upstream' | 'downstream';

/** The result of tracing from one item. Ids are facility and segment ids mixed. */
export interface Trace {
  /** The facility or pipe the trace started from. */
  origin: string;
  /** Everything product flows through to reach the origin. */
  upstream: ReadonlySet<string>;
  /** Everything product from the origin flows into. */
  downstream: ReadonlySet<string>;
}

/**
 * Walks the network from one facility, against the flow (`'up'`) or with it
 * (`'down'`), and returns every facility and pipe it reaches (not the start itself).
 *
 * A breadth-first search: visit the start, then everything one pipe away, then two
 * pipes away… The `seen` set stops it going round a loop forever.
 */
function walk(
  network: PipelineNetwork,
  startFacility: string,
  direction: 'up' | 'down',
): Set<string> {
  const reached = new Set<string>();
  const seen = new Set<string>([startFacility]);
  const queue = [startFacility];
  while (queue.length > 0) {
    const here = queue.shift() as string;
    for (const s of network.segments) {
      // Downstream follows pipes leaving `here`; upstream follows pipes arriving.
      const next =
        direction === 'down'
          ? s.from === here
            ? s.to
            : null
          : s.to === here
            ? s.from
            : null;
      if (next === null) continue;
      reached.add(s.id);
      if (!seen.has(next)) {
        seen.add(next);
        reached.add(next);
        queue.push(next);
      }
    }
  }
  return reached;
}

/**
 * Traces from a facility or a pipe. For a pipe, upstream starts at its `from`
 * facility and downstream at its `to` facility (both included).
 * Returns `null` for an id that is in neither list.
 *
 * @example
 * // A → B → C, and B → E
 * traceNetwork(network, 'B');
 * // { origin: 'B', upstream: {'A-B', 'A'}, downstream: {'B-C', 'C', 'B-E', 'E'} }
 */
export function traceNetwork(
  network: PipelineNetwork,
  id: string,
): Trace | null {
  if (network.facilities.some((f) => f.id === id)) {
    return {
      origin: id,
      upstream: walk(network, id, 'up'),
      downstream: walk(network, id, 'down'),
    };
  }
  const segment = network.segments.find((s) => s.id === id);
  if (!segment) return null;
  const upstream = walk(network, segment.from, 'up');
  upstream.add(segment.from);
  const downstream = walk(network, segment.to, 'down');
  downstream.add(segment.to);
  // In a loop, a later pipe can lead back to this one: it's the origin, not "downstream".
  upstream.delete(id);
  downstream.delete(id);
  return { origin: id, upstream, downstream };
}

/** Where `id` sits in `trace`, or `null` if it's outside it (it gets dimmed). */
export function traceRole(trace: Trace, id: string): TraceRole | null {
  if (id === trace.origin) return 'origin';
  // An item can be both (a loop): downstream wins, it's where product goes next.
  if (trace.downstream.has(id)) return 'downstream';
  if (trace.upstream.has(id)) return 'upstream';
  return null;
}

/**
 * What a screen reader announces when a trace starts:
 * "Tracing from Station C. Upstream: 2 pipes, 2 facilities. Downstream: 2 pipes, 2 facilities."
 */
export function traceSummary(
  trace: Trace,
  network: PipelineNetwork,
  originName: string,
): string {
  const facilityIds = new Set(network.facilities.map((f) => f.id));
  const count = (ids: ReadonlySet<string>) => {
    let facilities = 0;
    let pipes = 0;
    for (const id of ids) {
      if (id === trace.origin) continue;
      if (facilityIds.has(id)) facilities++;
      else pipes++;
    }
    if (facilities + pipes === 0) return 'nothing';
    return `${pipes} ${pipes === 1 ? 'pipe' : 'pipes'}, ${facilities} ${facilities === 1 ? 'facility' : 'facilities'}`;
  };
  return `Tracing from ${originName}. Upstream: ${count(trace.upstream)}. Downstream: ${count(trace.downstream)}.`;
}
