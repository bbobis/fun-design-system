import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapLegend } from './map-legend';
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
