/*
 * Made-up demo network for stories and tests. No real company data.
 *
 *   Terminal A ── Station B ── Station C ── Tank Farm D
 *                     │             │
 *                Terminal E         └───────── Refinery F
 */
import type {
  Batch,
  PipelineNetwork,
  PipelineSnapshot,
} from './pipeline-model';

/** Product codes in legend order (slot 1–3 solid, 4 striped). */
export const DEMO_PRODUCTS = ['SYN', 'DIL', 'SWT', 'CON'];

export const DEMO_NETWORK: PipelineNetwork = {
  facilities: [
    {
      id: 'A',
      label: 'Terminal A',
      kind: 'terminal',
      position: { x: 0, y: 1 },
    },
    {
      id: 'B',
      label: 'Station B',
      kind: 'pump-station',
      position: { x: 4, y: 1 },
      // A branch leaves downward, so the name goes above, off the pipe.
      labelPlacement: 'above',
    },
    {
      id: 'C',
      label: 'Station C',
      kind: 'pump-station',
      position: { x: 8, y: 1 },
      // A branch leaves downward, so the name goes above, off the pipe.
      labelPlacement: 'above',
    },
    {
      id: 'D',
      label: 'Tank Farm D',
      kind: 'tank-farm',
      position: { x: 12, y: 1 },
      alert: { level: 'warning', message: 'Tank T-3 above 95%' },
      tanks: [
        { id: 'T-1', label: 'T-1', volume: 41_000, capacity: 50_000 },
        { id: 'T-2', label: 'T-2', volume: 22_500, capacity: 50_000 },
        { id: 'T-3', label: 'T-3', volume: 48_000, capacity: 50_000 },
      ],
    },
    {
      id: 'E',
      label: 'Terminal E',
      kind: 'terminal',
      position: { x: 4, y: 4 },
      alert: { level: 'danger', message: 'Emergency shutdown' },
    },
    {
      id: 'F',
      label: 'Refinery F',
      kind: 'refinery',
      position: { x: 12, y: 4 },
    },
  ],
  segments: [
    {
      id: 'A-B',
      from: 'A',
      to: 'B',
      flowRate: 1100,
      maxFlowRate: 1200,
      status: 'running',
      batches: [
        { name: 'B-1041', product: 'SYN', volume: 52_000 },
        { name: 'B-1042', product: 'DIL', volume: 31_000 },
      ],
    },
    {
      id: 'B-C',
      from: 'B',
      to: 'C',
      flowRate: 700,
      maxFlowRate: 1200,
      status: 'restricted',
      batches: [
        { name: 'B-1039', product: 'SWT', volume: 28_000 },
        // B-1041 straddles Station B: its front is here (upstream end of B-C, last
        // in this downstream-first list), its tail is still in A-B (first there).
        { name: 'B-1041', product: 'SYN', volume: 44_000 },
      ],
    },
    {
      id: 'C-D',
      from: 'C',
      to: 'D',
      flowRate: 400,
      maxFlowRate: 800,
      status: 'running',
      batches: [{ name: 'B-1037', product: 'CON', volume: 20_000 }],
    },
    {
      id: 'B-E',
      from: 'B',
      to: 'E',
      flowRate: 0,
      maxFlowRate: 600,
      status: 'shutdown',
      batches: [{ name: 'B-1030', product: 'DIL', volume: 9_000 }],
    },
    {
      id: 'C-F',
      from: 'C',
      to: 'F',
      waypoints: [{ x: 8, y: 4 }],
      flowRate: 500,
      maxFlowRate: 800,
      status: 'running',
      batches: [
        { name: 'B-1035', product: 'SWT', volume: 15_000 },
        { name: 'B-1036', product: 'CON', volume: 12_000 },
      ],
    },
  ],
};

/** The demo network with new batches per pipe, and new tank volumes at Tank Farm D. */
function at(
  hour: string,
  batches: Record<string, Batch[]>,
  tankVolumes: [number, number, number],
): PipelineSnapshot {
  return {
    at: `2026-11-02T${hour}:00:00Z`,
    network: {
      facilities: DEMO_NETWORK.facilities.map((f) =>
        f.id === 'D' && f.tanks
          ? {
              ...f,
              tanks: f.tanks.map((t, i) => ({
                ...t,
                volume: tankVolumes[i] ?? t.volume,
              })),
            }
          : f,
      ),
      segments: DEMO_NETWORK.segments.map((s) => ({
        ...s,
        batches: batches[s.id] ?? s.batches,
      })),
    },
  };
}

const syn = (name: string, volume: number): Batch => ({
  name,
  product: 'SYN',
  volume,
});
const dil = (name: string, volume: number): Batch => ({
  name,
  product: 'DIL',
  volume,
});
const swt = (name: string, volume: number): Batch => ({
  name,
  product: 'SWT',
  volume,
});
const con = (name: string, volume: number): Batch => ({
  name,
  product: 'CON',
  volume,
});

/**
 * Five made-up hourly snapshots. Follow **B-1041 (SYN)**: it straddles Station B at
 * 06:00, fills B-C at 08:00, is entering C-D at 09:00, and has been delivered to Tank
 * Farm D by 10:00 (T-1 rises). Batches stay downstream-first in every pipe; B-E stays
 * shut down.
 */
export const DEMO_TIMELINE: PipelineSnapshot[] = [
  at('06', {}, [41_000, 22_500, 48_000]),
  at(
    '07',
    {
      'A-B': [
        syn('B-1041', 22_000),
        dil('B-1042', 31_000),
        swt('B-1043', 30_000),
      ],
      'B-C': [swt('B-1039', 6_000), syn('B-1041', 66_000)],
      'C-D': [swt('B-1039', 20_000)],
      'C-F': [con('B-1036', 27_000)],
    },
    [43_000, 22_500, 48_500],
  ),
  at(
    '08',
    {
      'A-B': [dil('B-1042', 45_000), swt('B-1043', 38_000)],
      'B-C': [syn('B-1041', 72_000)],
      'C-D': [swt('B-1039', 20_000)],
      'C-F': [con('B-1036', 27_000)],
    },
    [44_000, 22_500, 49_000],
  ),
  at(
    '09',
    {
      'A-B': [
        dil('B-1042', 13_000),
        swt('B-1043', 50_000),
        syn('B-1044', 20_000),
      ],
      'B-C': [syn('B-1041', 40_000), dil('B-1042', 32_000)],
      'C-D': [syn('B-1041', 20_000)],
      'C-F': [con('B-1036', 27_000)],
    },
    [46_000, 22_500, 49_200],
  ),
  at(
    '10',
    {
      'A-B': [swt('B-1043', 50_000), syn('B-1044', 33_000)],
      'B-C': [dil('B-1042', 72_000)],
      'C-D': [dil('B-1042', 20_000)],
      'C-F': [con('B-1036', 27_000)],
    },
    [49_500, 22_500, 49_300],
  ),
];
