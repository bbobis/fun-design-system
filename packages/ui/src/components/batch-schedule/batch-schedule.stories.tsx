import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DescriptionItem, DescriptionList } from '../description-list';
import { Drawer } from '../drawer';
import { MapLegend } from '../pipeline-map';
import { BatchSchedule } from './batch-schedule';
import {
  DEMO_BATCHES,
  DEMO_LINES,
  DEMO_SCHEDULE_PRODUCTS,
} from './batch-schedule.fixtures';
import type { ScheduledBatch, ScheduleLine } from './schedule-model';

const meta = {
  title: 'Patterns/BatchSchedule',
  component: BatchSchedule,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Injection schedule',
    lines: DEMO_LINES,
    batches: DEMO_BATCHES,
    products: DEMO_SCHEDULE_PRODUCTS,
    from: '2026-11-02',
    days: 7,
    timeZone: 'America/Edmonton',
    now: '2026-11-03T18:00:00Z',
  },
} satisfies Meta<typeof BatchSchedule>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A week in Edmonton time. Tab into it (one stop), then ←/→ along a line, ↑/↓ to the
 * closest batch on the next line, Home/End to the line's ends. 26-110 started before
 * Monday, so its start is cut; 26-118 runs past Sunday. 26-113T overlaps 26-113 and
 * gets its own lane. XYL isn't in `products`, so it's neutral gray.
 */
export const Week: Story = {};

/**
 * Click a batch (or Enter) to open its details in a Drawer. Screen readers already
 * hear the summary on the bar; the Drawer has the rest.
 */
export const WithDetails: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState<ScheduledBatch | null>(null);
    const line = DEMO_LINES.find((l) => l.id === open?.line);
    return (
      <>
        <BatchSchedule {...args} onBatchAction={setOpen} />
        <Drawer
          open={open !== null}
          onOpenChange={(o) => !o && setOpen(null)}
          title={open ? `Batch ${open.name}` : ''}
          size="sm"
        >
          {open && (
            <DescriptionList divided aria-label="Batch details">
              <DescriptionItem label="Product">{open.product}</DescriptionItem>
              <DescriptionItem label="Line">{line?.label}</DescriptionItem>
              <DescriptionItem label="Start">{open.start}</DescriptionItem>
              <DescriptionItem label="End">{open.end}</DescriptionItem>
              <DescriptionItem label="Volume">
                {open.volume?.toLocaleString()} m³
              </DescriptionItem>
              <DescriptionItem label="Status">{open.status}</DescriptionItem>
            </DescriptionList>
          )}
        </Drawer>
      </>
    );
  },
};

/** With the Pipeline Map's legend, so the product colors read the same in both. */
export const WithLegend: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <MapLegend products={DEMO_SCHEDULE_PRODUCTS} />
      <BatchSchedule {...args} />
    </div>
  ),
};

const manyLines: ScheduleLine[] = Array.from({ length: 8 }, (_, i) => ({
  id: `L${i + 1}`,
  label: `Line ${Math.floor(i / 2) + 1} · ${'ABCDEFGH'[i]} → ${'BCDEFGHI'[i]}`,
}));
const manyBatches: ScheduledBatch[] = manyLines.flatMap((line, i) =>
  Array.from({ length: 6 }, (_, j) => {
    const start =
      Date.parse('2026-11-01T07:00:00Z') + (j * 40 + i * 7) * 3_600_000;
    return {
      id: `${line.id}-${j}`,
      name: `26-${300 + i * 10 + j}`,
      product: DEMO_SCHEDULE_PRODUCTS[(i + j) % 4] as string,
      line: line.id,
      start: new Date(start).toISOString(),
      end: new Date(start + 38 * 3_600_000).toISOString(),
      volume: 20000 + j * 3000,
      status:
        j < 1
          ? 'complete'
          : j < 2
            ? 'active'
            : i === 3 && j === 3
              ? 'at-risk'
              : 'planned',
    };
  }),
);

/**
 * Two weeks across 8 lines: it scrolls sideways, and the line names stay pinned on
 * the left. Arrow keys scroll the focused batch into view.
 */
export const TwoWeeks: Story = {
  args: {
    lines: manyLines,
    batches: manyBatches,
    days: 14,
    from: '2026-11-01',
  },
};
