import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { AlarmList } from '../alarm-list';
import type { Alarm } from '../alarm-list/alarm-model';
import { EquipmentStatus } from '../equipment-status';
import { Gauge } from '../gauge';
import { Heading } from '../heading';
import { StationCard } from './station-card';
import { DEMO_NOW, DEMO_STATIONS } from './station-card.fixtures';
import { stationHealth } from './station-health';

const stationById = (id: string) => {
  const s = DEMO_STATIONS.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};
const B = stationById('b');

const meta = {
  title: 'Patterns/StationCard',
  component: StationCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { ...B, now: DEMO_NOW },
} satisfies Meta<typeof StationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Station B: a tripped pump and a P1 alarm, so it rolls up to "Abnormal". */
export const Playground: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

/**
 * The control-room overview: one card per station. The grid uses a **container
 * query** (`@container` + `@xl:` / `@4xl:`), so it picks 1, 2 or 3 columns from
 * the space *it* has, not the window: it works the same in a side panel.
 *
 * Only B (red) and D/E (amber) pull the eye; the rest stay gray.
 * Tab: one stop per card.
 */
export const Overview: Story = {
  render: () => (
    <section aria-labelledby="ov-title" className="@container">
      <Heading level={2} id="ov-title" className="mb-4">
        Hardisty line · 6 stations
      </Heading>
      <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
        {DEMO_STATIONS.map(({ id, ...s }) => (
          <StationCard key={id} {...s} now={DEMO_NOW} />
        ))}
      </div>
    </section>
  ),
};

/**
 * Where a card's link goes: the station page. Gauges up top, the full equipment
 * list as a table, and the station's AlarmList. Same parts as the card, just more
 * room. Acknowledge an alarm and watch the health line change.
 */
export const StationDetail: Story = {
  render: function Render() {
    const [alarms, setAlarms] = useState<Alarm[]>([...(B.alarms ?? [])]);
    const health = stationHealth(B.equipment, alarms, DEMO_NOW);
    return (
      <div className="flex max-w-4xl flex-col gap-6">
        <div>
          <Heading level={2}>{B.name}</Heading>
          <p className="text-sm text-fg-muted">{B.description}</p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">{health.word}:</span>{' '}
            {health.summary}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {B.readings?.map((r) => (
            <Gauge key={r.label} {...r} />
          ))}
        </div>
        <table className="w-full border-collapse text-sm">
          <caption className="pb-2 text-start font-semibold text-fg">
            Equipment
          </caption>
          <thead>
            <tr className="border-b border-border text-fg-muted">
              <th className="py-2 text-start font-medium">Equipment</th>
              <th className="py-2 text-start font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {B.equipment.map((e) => (
              <tr key={e.id} className="border-b border-border">
                <td className="py-2 text-fg">{e.name}</td>
                <td className="py-2">
                  <EquipmentStatus
                    variant="inline"
                    status={e.status}
                    label={e.label}
                    since={e.since}
                    now={DEMO_NOW}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <AlarmList
          aria-label="Station B alarms"
          alarms={alarms}
          now={new Date(DEMO_NOW).toISOString()}
          onAcknowledge={(ids) =>
            setAlarms((all) =>
              all.map((a) =>
                ids.includes(a.id) ? { ...a, acknowledged: true } : a,
              ),
            )
          }
        />
      </div>
    );
  },
};
