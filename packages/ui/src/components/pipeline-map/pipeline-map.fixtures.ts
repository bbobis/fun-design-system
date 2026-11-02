/*
 * Made-up demo network for stories and tests. No real company data.
 *
 *   Terminal A ── Station B ── Station C ── Tank Farm D
 *                     │             │
 *                Terminal E         └───────── Refinery F
 */
import type { PipelineNetwork } from './pipeline-model';

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
        { name: 'B-1040', product: 'SYN', volume: 44_000 },
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
