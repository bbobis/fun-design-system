import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { BatchTrain } from './batch-train';
import { PipeSegment } from './pipe-segment';
import { toPathData } from './pipeline-geometry';
import type { Batch, Point, SegmentStatus } from './pipeline-model';

/** Made-up product codes, in legend order. Slot 1–3 solid, 4–6 striped, 7+ "other". */
const PRODUCTS = ['SYN', 'DIL', 'SWT', 'CON', 'HVY', 'LSB'];
const STRAIGHT: Point[] = [
  { x: 0, y: 1.5 },
  { x: 10, y: 1.5 },
];
const BATCHES: Batch[] = [
  { name: 'B-1041', product: 'SYN', volume: 5000 },
  { name: 'B-1042', product: 'DIL', volume: 3000 },
  { name: 'B-1043', product: 'SWT', volume: 2000 },
];

/** A schematic canvas `12 × height` grid units drawn `width` px wide. */
function Canvas({
  children,
  width = 480,
  height = 2.5,
  label,
}: {
  children: (unitsPerPx: number) => ReactNode;
  width?: number;
  height?: number;
  label: string;
}) {
  return (
    <svg
      viewBox={`-1 0 12 ${height}`}
      width={width}
      role="group"
      aria-label={label}
      className="block rounded-md border border-border bg-bg"
    >
      {children(12 / width)}
    </svg>
  );
}

/** One pipe with its batch band, as the map will draw it. */
function Pipe({
  points = STRAIGHT,
  batches = BATCHES,
  status = 'running',
  unitsPerPx,
}: {
  points?: Point[];
  batches?: Batch[];
  status?: SegmentStatus;
  unitsPerPx: number;
}) {
  return (
    <>
      <PipeSegment
        d={toPathData(points)}
        status={status}
        flowRate={status === 'shutdown' ? 0 : 900}
        maxFlowRate={1200}
      />
      <BatchTrain
        points={points}
        batches={batches}
        products={PRODUCTS}
        unitsPerPx={unitsPerPx}
      />
    </>
  );
}

const meta = {
  title: 'Pipeline Map/BatchTrain',
  component: BatchTrain,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    points: STRAIGHT,
    batches: BATCHES,
    products: PRODUCTS,
    unitsPerPx: 12 / 480,
    label:
      '3 batches, downstream first: B-1041 SYN 5,000 m³, B-1042 DIL 3,000 m³, B-1043 SWT 2,000 m³',
  },
  render: (args) => (
    <Canvas label="Batch preview">
      {(unitsPerPx) => (
        <>
          <PipeSegment
            d={toPathData(args.points)}
            status="running"
            flowRate={900}
            maxFlowRate={1200}
          />
          <BatchTrain {...args} unitsPerPx={unitsPerPx} />
        </>
      )}
    </Canvas>
  ),
} satisfies Meta<typeof BatchTrain>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Flow goes left to right: the oldest batch (B-1041) is nearest the downstream end. */
export const Playground: Story = {};

/** All six product looks, then "other" (a 7th product). Hue **and** stripes. */
export const Products: Story = {
  render: () => (
    <Canvas label="Every product look">
      {(unitsPerPx) => (
        <Pipe
          unitsPerPx={unitsPerPx}
          batches={[...PRODUCTS, 'XTRA'].map((product, i) => ({
            name: `B-${i}`,
            product,
            volume: 1000,
          }))}
        />
      )}
    </Canvas>
  ),
};

/** The band rides beside every status, so batches stay readable when a pipe is stopped. */
export const WithEachStatus: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm text-fg">
      {(['running', 'restricted', 'shutdown'] as const).map((status) => (
        <div key={status} className="flex items-center gap-4">
          <span className="w-24">{status}</span>
          <Canvas label={`${status} pipe with batches`} width={420}>
            {(unitsPerPx) => <Pipe status={status} unitsPerPx={unitsPerPx} />}
          </Canvas>
        </div>
      ))}
    </div>
  ),
};

/** Batches follow the pipe around elbows; a batch can span a corner. */
export const Elbow: Story = {
  render: () => {
    const points: Point[] = [
      { x: 0, y: 1.5 },
      { x: 6, y: 1.5 },
      { x: 6, y: 5 },
      { x: 10, y: 5 },
    ];
    return (
      <Canvas label="Elbow pipe with batches" height={6}>
        {(unitsPerPx) => <Pipe points={points} unitsPerPx={unitsPerPx} />}
      </Canvas>
    );
  },
};

/** Same data on a small and a large map: band offset, width and gaps stay in pixels. */
export const SameSizeAtAnyScale: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {[240, 720].map((width) => (
        <Canvas key={width} label={`Map ${width}px wide`} width={width}>
          {(unitsPerPx) => <Pipe unitsPerPx={unitsPerPx} />}
        </Canvas>
      ))}
    </div>
  ),
};
