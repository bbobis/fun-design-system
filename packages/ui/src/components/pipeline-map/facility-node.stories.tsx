import type { Meta, StoryObj } from '@storybook/react-vite';
import { BatchTrain } from './batch-train';
import { FacilityNode } from './facility-node';
import { PipeSegment } from './pipe-segment';
import { toPathData } from './pipeline-geometry';
import type { Facility, Segment } from './pipeline-model';

/** A made-up network: 4 facilities on one line. Grid units, 12 wide. */
const FACILITIES: Facility[] = [
  {
    id: 'A',
    label: 'Terminal A',
    kind: 'terminal',
    position: { x: 0, y: 1.5 },
  },
  {
    id: 'B',
    label: 'Station B',
    kind: 'pump-station',
    position: { x: 3.3, y: 1.5 },
  },
  {
    id: 'C',
    label: 'Tank Farm C',
    kind: 'tank-farm',
    position: { x: 6.6, y: 1.5 },
    alert: { level: 'warning', message: 'Tank T-3 above 95%' },
    tanks: [
      { id: 'T-1', label: 'T-1', volume: 41_000, capacity: 50_000 },
      { id: 'T-2', label: 'T-2', volume: 22_500, capacity: 50_000 },
      { id: 'T-3', label: 'T-3', volume: 48_000, capacity: 50_000 },
    ],
  },
  {
    id: 'D',
    label: 'Refinery D',
    kind: 'refinery',
    position: { x: 10, y: 1.5 },
  },
];
const SEGMENTS: Pick<Segment, 'from' | 'to' | 'status' | 'flowRate'>[] = [
  { from: 'A', to: 'B', status: 'running', flowRate: 1100 },
  { from: 'B', to: 'C', status: 'restricted', flowRate: 700 },
  { from: 'C', to: 'D', status: 'running', flowRate: 400 },
];
const PRODUCTS = ['SYN', 'DIL', 'SWT'];
const WIDTH = 720;
const UNITS_PER_PX = 12 / WIDTH;
const at = (id: string) =>
  FACILITIES.find((f) => f.id === id)?.position ?? { x: 0, y: 0 };

/** Pipes and batches first, nodes last: SVG paints in order, so nodes land on top. */
function Network({
  selectedId,
  focusable = false,
}: {
  selectedId?: string;
  focusable?: boolean;
}) {
  return (
    <svg
      viewBox="-1 0 12 3.4"
      width={WIDTH}
      role="group"
      aria-label="Example network"
      className="block rounded-md border border-border bg-bg"
    >
      {SEGMENTS.map((s) => {
        const points = [at(s.from), at(s.to)];
        return (
          <g key={s.from}>
            <PipeSegment
              d={toPathData(points)}
              status={s.status}
              flowRate={s.flowRate}
              maxFlowRate={1200}
            />
            <BatchTrain
              points={points}
              unitsPerPx={UNITS_PER_PX}
              products={PRODUCTS}
              batches={[
                { name: `${s.from}-1`, product: 'SYN', volume: 3 },
                { name: `${s.from}-2`, product: 'DIL', volume: 2 },
              ]}
            />
          </g>
        );
      })}
      {FACILITIES.map((f) => (
        <FacilityNode
          key={f.id}
          position={f.position}
          unitsPerPx={UNITS_PER_PX}
          label={f.label}
          kind={f.kind}
          alert={f.alert}
          tanks={f.tanks}
          selected={f.id === selectedId}
          tabIndex={focusable ? 0 : undefined}
        />
      ))}
    </svg>
  );
}

const meta = {
  title: 'Pipeline Map/FacilityNode',
  component: FacilityNode,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    position: { x: 2, y: 1 },
    unitsPerPx: 4 / 240,
    label: 'Tank Farm C',
    kind: 'tank-farm',
    alert: { level: 'warning', message: 'Tank T-3 above 95%' },
    tanks: FACILITIES[2]?.tanks,
  },
  render: (args) => (
    <svg
      viewBox="0 0 4 2.6"
      width={240}
      className="block rounded-md border border-border bg-bg"
    >
      <FacilityNode {...args} />
    </svg>
  ),
} satisfies Meta<typeof FacilityNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Shape tells the kind: square terminal, circle pump station, capsule tank farm, roofline refinery. */
export const Kinds: Story = {
  render: () => (
    <svg
      viewBox="0 0 12 2"
      width={WIDTH}
      className="block rounded-md border border-border bg-bg"
    >
      {(['terminal', 'pump-station', 'tank-farm', 'refinery'] as const).map(
        (kind, i) => (
          <FacilityNode
            key={kind}
            position={{ x: 1.5 + i * 3, y: 0.7 }}
            unitsPerPx={UNITS_PER_PX}
            label={kind.replace('-', ' ')}
            kind={kind}
          />
        ),
      )}
    </svg>
  ),
};

/** Warning is a triangle, danger a circle: shape and color, with the message in the name. */
export const Alerts: Story = {
  render: () => (
    <svg
      viewBox="0 0 12 2"
      width={WIDTH}
      className="block rounded-md border border-border bg-bg"
    >
      <FacilityNode
        position={{ x: 3, y: 0.8 }}
        unitsPerPx={UNITS_PER_PX}
        label="Station B"
        kind="pump-station"
        alert={{ level: 'warning', message: 'Pump 2 vibration' }}
      />
      <FacilityNode
        position={{ x: 9, y: 0.8 }}
        unitsPerPx={UNITS_PER_PX}
        label="Terminal A"
        kind="terminal"
        alert={{ level: 'danger', message: 'ESD triggered' }}
      />
    </svg>
  ),
};

/** On a line with pipes and batches. Nodes are drawn last, so they sit on top of the pipe ends. */
export const OnANetwork: Story = { render: () => <Network /> };

/** Station B selected (ring), focusable nodes: Tab to Terminal A to see the keyboard focus ring. */
export const SelectedAndFocus: Story = {
  render: () => <Network selectedId="B" focusable />,
};

/**
 * `labelPlacement` moves the name around the marker: below (default), above, left,
 * right. The tank gauge stays under the marker. Use it to keep names off pipes.
 */
export const LabelPlacements: Story = {
  render: () => (
    <svg
      viewBox="0 0 12 2.6"
      width={WIDTH}
      className="block rounded-md border border-border bg-bg"
    >
      {(['below', 'above', 'left', 'right'] as const).map((placement, i) => (
        <FacilityNode
          key={placement}
          position={{ x: 1.5 + i * 3, y: 1.1 }}
          unitsPerPx={UNITS_PER_PX}
          label={placement}
          kind="tank-farm"
          labelPlacement={placement}
          alert={{ level: 'warning', message: 'High level' }}
          tanks={[
            { id: 'T-1', label: 'T-1', volume: 30, capacity: 50 },
            { id: 'T-2', label: 'T-2', volume: 48, capacity: 50 },
          ]}
        />
      ))}
    </svg>
  ),
};
