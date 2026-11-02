import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { MapLegend } from './map-legend';
import type { MapFilter } from './pipeline-filter';
import { DEMO_PRODUCTS } from './pipeline-map.fixtures';

const meta = {
  title: 'Pipeline Map/MapLegend',
  component: MapLegend,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    products: DEMO_PRODUCTS,
    productNames: {
      SYN: 'Synthetic crude',
      DIL: 'Diluted bitumen',
      SWT: 'Light sweet',
      CON: 'Condensate',
    },
  },
} satisfies Meta<typeof MapLegend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The key for the demo network. Swatches come from the map's own primitives. */
export const Playground: Story = {};

/** Products 7 and up fold into "Other" (gray, striped), so colors never run out silently. */
export const ManyProducts: Story = {
  args: {
    products: ['SYN', 'DIL', 'SWT', 'CON', 'HVY', 'LSB', 'XTRA', 'YTRA'],
    productNames: undefined,
  },
};

/**
 * With `filter` + `onFilterChange`, Products and Pipe status become toggle buttons.
 * Tab into a group, ↑/↓ to move, Space to toggle. "Clear filters" appears while one is on.
 */
export const AsFilters: Story = {
  render: (args) => {
    function Example() {
      const [filter, setFilter] = useState<MapFilter>({
        products: ['DIL'],
        statuses: ['restricted'],
      });
      return <MapLegend {...args} filter={filter} onFilterChange={setFilter} />;
    }
    return <Example />;
  },
};
