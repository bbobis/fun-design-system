/*
 * Legend filters: which products and pipe statuses to bring forward.
 * Pure functions, no React: easy to test.
 */
import type {
  Batch,
  PipelineNetwork,
  Segment,
  SegmentStatus,
} from './pipeline-model';

/**
 * What to bring forward on the map. Everything else fades (it is never hidden, so the
 * network keeps its shape). An empty or missing list means "no filter on that".
 *
 * @example
 * { products: ['SYN'] }                       // pipes carrying SYN, and SYN batches
 * { statuses: ['restricted', 'shutdown'] }    // pipes that aren't running normally
 * { products: ['SYN'], statuses: ['running'] } // both must match (AND)
 */
export interface MapFilter {
  products?: readonly string[];
  statuses?: readonly SegmentStatus[];
}

/** True when at least one list has something in it. */
export function isFilterActive(filter: MapFilter | undefined): boolean {
  return Boolean(filter?.products?.length || filter?.statuses?.length);
}

/** Does this batch match the product filter? Always true with no product filter. */
export function batchMatches(
  batch: Batch,
  filter: MapFilter | undefined,
): boolean {
  const products = filter?.products;
  return !products?.length || products.includes(batch.product);
}

/**
 * Does this pipe match? Its status must be in `statuses` (if any), **and** it must
 * carry at least one matching batch (if `products` is set).
 */
export function segmentMatches(
  segment: Segment,
  filter: MapFilter | undefined,
): boolean {
  const statuses = filter?.statuses;
  if (statuses?.length && !statuses.includes(segment.status)) return false;
  if (!filter?.products?.length) return true;
  return segment.batches.some((b) => batchMatches(b, filter));
}

/** What a screen reader hears when the filter changes: "Filter on: 2 of 5 pipes match." */
export function filterSummary(
  network: PipelineNetwork,
  filter: MapFilter | undefined,
): string {
  if (!isFilterActive(filter)) return 'Filter off.';
  const total = network.segments.length;
  const matching = network.segments.filter((s) =>
    segmentMatches(s, filter),
  ).length;
  return `Filter on: ${matching} of ${total} ${total === 1 ? 'pipe matches' : 'pipes match'}.`;
}
