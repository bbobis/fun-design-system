import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { PipeSegment } from './pipe-segment';

/** A small schematic canvas: 12 × `height` grid units, scaled to `width` pixels. */
function Canvas({
  children,
  width = 480,
  height = 2,
  label,
}: {
  children: ReactNode;
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
      {children}
    </svg>
  );
}

const meta = {
  title: 'Pipeline Map/PipeSegment',
  component: PipeSegment,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    d: 'M 0 1 L 10 1',
    status: 'running',
    flowRate: 900,
    maxFlowRate: 1200,
    label: 'Terminal A to Station B, running, 900 m³/h',
  },
  render: (args) => (
    <Canvas label="Pipe preview" height={2}>
      <PipeSegment {...args} />
    </Canvas>
  ),
} satisfies Meta<typeof PipeSegment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Status is color **and** pattern: solid, dashed, dotted. Check it in grayscale too. */
export const Statuses: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm text-fg">
      {(['running', 'restricted', 'shutdown'] as const).map((status) => (
        <div key={status} className="flex items-center gap-4">
          <span className="w-24">{status}</span>
          <Canvas label={`${status} pipe`} height={2} width={360}>
            <PipeSegment
              d="M 0 1 L 10 1"
              status={status}
              flowRate={status === 'shutdown' ? 0 : 900}
              maxFlowRate={1200}
            />
          </Canvas>
        </div>
      ))}
    </div>
  ),
};

/** Width is flow ÷ max flow, from 2px (no flow) to 10px (full). */
export const FlowWidths: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm text-fg">
      {[0, 300, 600, 900, 1200].map((flowRate) => (
        <div key={flowRate} className="flex items-center gap-4">
          <span className="w-24 tabular-nums">{flowRate} m³/h</span>
          <Canvas label={`${flowRate} m³/h`} height={2} width={360}>
            <PipeSegment
              d="M 0 1 L 10 1"
              status="running"
              flowRate={flowRate}
              maxFlowRate={1200}
            />
          </Canvas>
        </div>
      ))}
    </div>
  ),
};

/** Elbows are just waypoints in the path. Joins are rounded. */
export const Elbow: Story = {
  render: () => (
    <Canvas label="Elbow pipe" height={6}>
      <PipeSegment
        d="M 0 1 L 6 1 L 6 5 L 10 5"
        status="restricted"
        flowRate={800}
        maxFlowRate={1200}
        label="Station B to Tank Farm C, restricted, 800 m³/h"
      />
    </Canvas>
  ),
};

/**
 * The same pipe on a small and a large map. The line stays the same width on screen,
 * so width always means flow, never zoom.
 */
export const SameWidthAtAnySize: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {[240, 720].map((width) => (
        <Canvas
          key={width}
          label={`Map ${width}px wide`}
          width={width}
          height={2}
        >
          <PipeSegment
            d="M 0 1 L 10 1"
            status="restricted"
            flowRate={600}
            maxFlowRate={1200}
          />
        </Canvas>
      ))}
    </div>
  ),
};
