/*
 * "Follow a batch": one batch, wherever it is in the network.
 * Pure functions, no React: easy to test.
 */
import type { PipelineNetwork } from './pipeline-model';

/** Where a batch is: each pipe it is in, and how much of it is there. */
export interface BatchLocation {
  name: string;
  product: string;
  /** The pipes holding part of the batch, in network order, with the m³ in each. */
  parts: { segmentId: string; volume: number }[];
  /** All of it, in m³. */
  totalVolume: number;
}

/**
 * Finds every part of a batch. A batch is identified by its **name** across the
 * whole network: a batch crossing a station shows up in two pipes, once in each.
 * Returns `null` when no pipe holds it.
 *
 * @example
 * findBatch(network, 'B-1041');
 * // { name: 'B-1041', product: 'SYN', totalVolume: 96_000,
 * //   parts: [{ segmentId: 'A-B', volume: 52_000 }, { segmentId: 'B-C', volume: 44_000 }] }
 */
export function findBatch(
  network: PipelineNetwork,
  name: string,
): BatchLocation | null {
  const parts: BatchLocation['parts'] = [];
  let product: string | null = null;
  for (const segment of network.segments) {
    for (const batch of segment.batches) {
      if (batch.name !== name) continue;
      product ??= batch.product;
      parts.push({ segmentId: segment.id, volume: batch.volume });
    }
  }
  if (product === null) return null;
  return {
    name,
    product,
    parts,
    totalVolume: parts.reduce((sum, p) => sum + p.volume, 0),
  };
}

/**
 * The next batch to follow when `B` is pressed on a pipe: its batches in order
 * (downstream first), then `null` (stop following), then round again.
 */
export function nextBatchInSegment(
  network: PipelineNetwork,
  segmentId: string,
  current: string | null,
): string | null {
  const names =
    network.segments
      .find((s) => s.id === segmentId)
      ?.batches.map((b) => b.name) ?? [];
  if (names.length === 0) return null;
  const at = current === null ? -1 : names.indexOf(current);
  // Not in this pipe (or nothing followed yet): start at its first batch.
  if (at === -1) return names[0] ?? null;
  return names[at + 1] ?? null;
}

const numberFormat = new Intl.NumberFormat();

/** What a screen reader hears: "Following B-1041, SYN: 96,000 m³ across 2 pipes." */
export function batchSummary(location: BatchLocation): string {
  const pipes = location.parts.length;
  return `Following ${location.name}, ${location.product}: ${numberFormat.format(location.totalVolume)} m³ ${pipes === 1 ? 'in 1 pipe' : `across ${pipes} pipes`}.`;
}
