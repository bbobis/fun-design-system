import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../button';
import { AlarmList } from './alarm-list';
import { DEMO_ALARMS, DEMO_NOW } from './alarm-list.fixtures';
import type { Alarm } from './alarm-model';

const meta = {
  title: 'Patterns/AlarmList',
  component: AlarmList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    'aria-label': 'Active alarms',
    alarms: DEMO_ALARMS,
    now: DEMO_NOW,
    onAcknowledge: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlarmList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A live alarm summary. Priority 1 ◆ red, 2 ▲ orange, 3 ■, 4 ●: shape and number,
 * not color alone. Unacknowledged rows are bold with a bar; the cleared FT-1010 waits
 * (muted) until someone acknowledges it. Tick rows to acknowledge or shelve them;
 * with nothing ticked, "Acknowledge all". "Raise an alarm" adds a priority 1 alarm:
 * screen readers hear it at once.
 */
export const ControlRoom: Story = {
  render: function Render(args) {
    const [alarms, setAlarms] = useState<Alarm[]>(DEMO_ALARMS);
    const now = Date.parse(DEMO_NOW);
    return (
      <div className="flex flex-col gap-3">
        <AlarmList
          {...args}
          alarms={alarms}
          onAcknowledge={(ids) =>
            setAlarms((all) =>
              all
                .map((a) =>
                  ids.includes(a.id) ? { ...a, acknowledged: true } : a,
                )
                // Cleared + acknowledged: done, off the list.
                .filter((a) => !(a.state === 'cleared' && a.acknowledged)),
            )
          }
          onShelve={(ids, minutes) =>
            setAlarms((all) =>
              all.map((a) =>
                ids.includes(a.id)
                  ? {
                      ...a,
                      shelvedUntil: new Date(
                        now + minutes * 60_000,
                      ).toISOString(),
                    }
                  : a,
              ),
            )
          }
        />
        <div>
          <Button
            intent="secondary"
            size="sm"
            onClick={() =>
              setAlarms((all) => [
                ...all,
                {
                  id: `n${all.length}`,
                  priority: 1,
                  tag: 'PT-2043',
                  message: 'Discharge pressure high-high',
                  location: 'Station B · Pump 3',
                  raisedAt: DEMO_NOW,
                  state: 'active',
                  acknowledged: false,
                },
              ])
            }
          >
            Raise an alarm
          </Button>
        </div>
      </div>
    );
  },
};

/** Nothing to show: an all-clear message instead of an empty box. */
export const AllClear: Story = { args: { alarms: [] } };
