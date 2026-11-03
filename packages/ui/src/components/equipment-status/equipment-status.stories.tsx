import type { Meta, StoryObj } from '@storybook/react-vite';
import { EquipmentStatus } from './equipment-status';
import { stateLabel, type EquipmentState } from './equipment-status-model';

/** "Now" for the demos: Tue Nov 3, 2026, 10:30 UTC. */
const NOW = Date.parse('2026-11-03T10:30:00Z');
const ALL = Object.keys(stateLabel) as EquipmentState[];

const meta = {
  title: 'Patterns/EquipmentStatus',
  component: EquipmentStatus,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    status: 'running',
    variant: 'badge',
    size: 'md',
    name: 'Pump 2',
    since: '2026-11-03T07:10:00Z',
    now: NOW,
  },
  argTypes: {
    status: { control: 'select', options: ALL },
    variant: { control: 'radio', options: ['badge', 'inline', 'icon'] },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof EquipmentStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Every state in all three variants. Squint, or view in grayscale: each row still
 * reads, because the shape differs, not just the color.
 */
export const AllStates: Story = {
  render: () => (
    <table className="border-separate border-spacing-x-6 border-spacing-y-2 text-sm">
      <thead>
        <tr className="text-start text-fg-muted">
          <th className="text-start font-medium">Badge</th>
          <th className="text-start font-medium">Inline</th>
          <th className="text-start font-medium">Icon</th>
          <th className="text-start font-medium">Small</th>
        </tr>
      </thead>
      <tbody>
        {ALL.map((s) => (
          <tr key={s}>
            <td>
              <EquipmentStatus status={s} />
            </td>
            <td>
              <EquipmentStatus status={s} variant="inline" />
            </td>
            <td>
              <EquipmentStatus status={s} variant="icon" name="Pump 2" />
            </td>
            <td>
              <EquipmentStatus status={s} size="sm" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

const STATION = [
  {
    tag: 'P-201',
    name: 'Mainline pump 1',
    status: 'running',
    since: '2026-11-01T06:00:00Z',
  },
  {
    tag: 'P-202',
    name: 'Mainline pump 2',
    status: 'fault',
    since: '2026-11-03T10:18:00Z',
    label: 'Tripped',
  },
  {
    tag: 'P-203',
    name: 'Standby pump',
    status: 'stopped',
    since: '2026-10-28T14:00:00Z',
  },
  {
    tag: 'P-204',
    name: 'Booster pump',
    status: 'starting',
    since: '2026-11-03T10:29:40Z',
  },
  {
    tag: 'MOV-210',
    name: 'Suction valve',
    status: 'maintenance',
    since: '2026-11-03T08:00:00Z',
  },
  {
    tag: 'FT-220',
    name: 'Station meter',
    status: 'comms-lost',
    since: '2026-11-03T10:24:00Z',
  },
] as const;

/**
 * The common use: a station's equipment table. Inline variant, with time in state.
 * Only the tripped pump (red) and the silent meter (amber) catch the eye.
 */
export const StationTable: Story = {
  render: () => (
    <table className="w-full max-w-2xl border-collapse text-sm">
      <caption className="pb-2 text-start font-semibold text-fg">
        Station B equipment
      </caption>
      <thead>
        <tr className="border-b border-border text-fg-muted">
          <th className="py-2 text-start font-medium">Tag</th>
          <th className="py-2 text-start font-medium">Equipment</th>
          <th className="py-2 text-start font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {STATION.map((e) => (
          <tr key={e.tag} className="border-b border-border">
            <td className="py-2 font-mono text-xs text-fg-muted">{e.tag}</td>
            <td className="py-2 text-fg">{e.name}</td>
            <td className="py-2">
              <EquipmentStatus
                variant="inline"
                status={e.status}
                since={e.since}
                now={NOW}
                label={'label' in e ? e.label : undefined}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/**
 * Icons on a schematic strip, as on a P&ID overview. Tab through them: each one is
 * named ("Mainline pump 2: Tripped, for 12 minutes") and shows a tooltip.
 */
export const SchematicIcons: Story = {
  render: () => (
    <div className="flex max-w-2xl items-center rounded-lg border border-border bg-surface p-6">
      {STATION.map((e, i) => (
        <div key={e.tag} className="flex flex-1 items-center">
          <div className="flex flex-col items-center gap-1">
            <EquipmentStatus
              variant="icon"
              name={e.name}
              status={e.status}
              since={e.since}
              now={NOW}
              label={'label' in e ? e.label : undefined}
            />
            <span className="font-mono text-[0.6875rem] text-fg-muted">
              {e.tag}
            </span>
          </div>
          {i < STATION.length - 1 && (
            <span
              aria-hidden="true"
              className="mx-1 mb-4 h-0.5 flex-1 bg-line-neutral"
            />
          )}
        </div>
      ))}
    </div>
  ),
};
