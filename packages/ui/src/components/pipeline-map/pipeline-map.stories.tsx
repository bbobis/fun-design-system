import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  PipelineMap,
  PipelineMapFacilities,
  PipelineMapSegments,
} from './pipeline-map';
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
 * Click a pipe or facility (or Tab to it and press Enter) to select; Escape clears.
 */
export const Playground: Story = {};

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
