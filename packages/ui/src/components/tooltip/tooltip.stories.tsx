import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SVGProps } from 'react';
import { Button } from '../button';
import { Tooltip } from './tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { content: 'Hint', children: <span /> },
  decorators: [
    (Story) => (
      <div className="pt-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Icon-only toolbar buttons. Hover one (it waits 0.7 s), then slide to the next: it
 * shows at once ("warm-up"). Tab between them: keyboard focus shows the hint too, but
 * a mouse click doesn't. Each button is still named by its own `aria-label`.
 */
export const Toolbar: Story = {
  render: () => (
    <div className="flex gap-1">
      <Tooltip content="Export as CSV">
        <Button intent="ghost" size="sm" aria-label="Export">
          <DownloadIcon className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Print this view">
        <Button intent="ghost" size="sm" aria-label="Print">
          <PrintIcon className="size-4" />
        </Button>
      </Tooltip>
      <Tooltip content="Refresh (data is 3 min old)">
        <Button intent="ghost" size="sm" aria-label="Refresh">
          <RefreshIcon className="size-4" />
        </Button>
      </Tooltip>
    </div>
  ),
};

/** `placement`: flips by itself near the edge of the screen. */
export const Placements: Story = {
  render: () => (
    <div className="flex gap-2 px-24 py-8">
      {(['top', 'bottom', 'start', 'end'] as const).map((placement) => (
        <Tooltip
          key={placement}
          content={`On the ${placement}`}
          placement={placement}
        >
          <Button intent="secondary" size="sm">
            {placement}
          </Button>
        </Tooltip>
      ))}
    </div>
  ),
};

function Icon({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}
const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M8 2.5v8m0 0-3-3m3 3 3-3M3 13.5h10" {...p} />
);
const PrintIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M4.5 6V2.5h7V6M4.5 11h-2V6h11v5h-2M4.5 9h7v4.5h-7z" {...p} />
);
const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M13 8a5 5 0 1 1-1.5-3.5M13 2.5v3h-3" {...p} />
);
