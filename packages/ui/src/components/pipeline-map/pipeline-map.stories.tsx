import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  PipelineMap,
  PipelineMapFacilities,
  PipelineMapSegments,
} from './pipeline-map';
import { Button } from '../button/button';
import { DEMO_NETWORK, DEMO_PRODUCTS } from './pipeline-map.fixtures';

const meta = {
  title: 'Pipeline Map/PipelineMap',
  component: PipelineMap,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    network: DEMO_NETWORK,
    products: DEMO_PRODUCTS,
    'aria-label': 'Demo network',
  },
} satisfies Meta<typeof PipelineMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Six made-up facilities, five pipes: a restricted line, a shut-down branch, an
 * elbow, a tank farm with a high tank and an emergency at Terminal E.
 * Click a pipe or facility to select it; Escape clears. Hover for details.
 */
export const Playground: Story = {};

/**
 * Keyboard: Tab once into the map (Terminal A), then arrows walk the network:
 * facility → the pipe leaving that way → the facility at its end. Home/End jump to the
 * first/last facility, Enter selects, Escape clears, Tab leaves the map. The focused
 * item's tooltip shows its batches or tank levels.
 */
export const Keyboard: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3 text-sm text-fg">
      <button
        type="button"
        className="self-start rounded-md border border-border px-3 py-1"
      >
        Before the map
      </button>
      <PipelineMap {...args} />
      <button
        type="button"
        className="self-start rounded-md border border-border px-3 py-1"
      >
        After the map
      </button>
    </div>
  ),
};

/** Controlled: the app owns the selection and can show details for it. */
export const ControlledSelection: Story = {
  render: (args) => {
    function Example() {
      const [id, setId] = useState<string | null>('B-C');
      const facility = DEMO_NETWORK.facilities.find((f) => f.id === id);
      const segment = DEMO_NETWORK.segments.find((s) => s.id === id);
      return (
        <div className="flex flex-col gap-3 text-sm text-fg">
          <PipelineMap {...args} selectedId={id} onSelect={setId} />
          <p aria-live="polite">
            Selected:{' '}
            <strong>
              {facility?.label ??
                (segment ? `${segment.from} → ${segment.to}` : 'nothing')}
            </strong>
          </p>
        </div>
      );
    }
    return <Example />;
  },
};

/** Markers, line widths and gaps stay the same size in px; only the distances scale. */
/**
 * **Trace the flow.** Focus Station C and press `T`: everything that feeds it and
 * everything it feeds stays bright, and the branch to Terminal E fades. `T` again
 * stops; Escape clears the trace before the selection.
 *
 * The trace is its own state, separate from selection. Here the app controls both,
 * so a button can trace whatever is selected (a mouse path until the context menu lands).
 */
export const TraceTheFlow: Story = {
  render: (args) => {
    function Example() {
      const [selectedId, setSelectedId] = useState<string | null>('C');
      const [tracedId, setTracedId] = useState<string | null>('C');
      return (
        <div className="flex flex-col gap-3 text-sm text-fg">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              intent="outline"
              size="sm"
              disabled={selectedId === null}
              onClick={() => setTracedId(selectedId)}
            >
              Trace selected
            </Button>
            <Button
              intent="ghost"
              size="sm"
              disabled={tracedId === null}
              onClick={() => setTracedId(null)}
            >
              Clear trace
            </Button>
            <span className="text-fg-muted">
              {tracedId ? `Tracing from ${tracedId}` : 'No trace'}
            </span>
          </div>
          <PipelineMap
            {...args}
            selectedId={selectedId}
            onSelect={setSelectedId}
            tracedId={tracedId}
            onTraceChange={setTracedId}
          />
        </div>
      );
    }
    return <Example />;
  },
};

export const AtTwoWidths: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="w-[420px] rounded-md border border-border">
        <PipelineMap {...args} aria-label="Narrow map" />
      </div>
      <div className="w-[980px] max-w-full rounded-md border border-border">
        <PipelineMap {...args} aria-label="Wide map" />
      </div>
    </div>
  ),
};

/** Layers are parts you can pick and order. Here: facilities only. */
export const FacilitiesOnly: Story = {
  render: (args) => (
    <PipelineMap {...args} aria-label="Facilities only">
      <PipelineMapFacilities />
    </PipelineMap>
  ),
};

/** The default layers written out: pipes first, facilities on top. */
export const ExplicitLayers: Story = {
  render: (args) => (
    <PipelineMap {...args}>
      <PipelineMapSegments />
      <PipelineMapFacilities />
    </PipelineMap>
  ),
};
