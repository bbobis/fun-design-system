import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MapLegend } from './map-legend';
import { PipelineMap } from './pipeline-map';
import { PipelineMapTable } from './pipeline-map-table';
import { DEMO_NETWORK, DEMO_PRODUCTS } from './pipeline-map.fixtures';

const meta = {
  title: 'Pipeline Map/PipelineMapTable',
  component: PipelineMapTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { network: DEMO_NETWORK },
} satisfies Meta<typeof PipelineMapTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Read-only: every number on the map, as text. */
export const Playground: Story = {};

/**
 * The whole kit: map, legend and table, sharing one selection. Click a route or
 * facility name in the table, or an item on the map: both follow.
 */
export const WithMapAndLegend: Story = {
  render: (args) => {
    function Example() {
      const [id, setId] = useState<string | null>('B-C');
      return (
        <div className="flex flex-col gap-6">
          <PipelineMap
            network={args.network}
            products={DEMO_PRODUCTS}
            aria-label="Demo network"
            selectedId={id}
            onSelect={setId}
          />
          <MapLegend products={DEMO_PRODUCTS} />
          <PipelineMapTable
            network={args.network}
            selectedId={id}
            onSelect={setId}
          />
        </div>
      );
    }
    return <Example />;
  },
};
