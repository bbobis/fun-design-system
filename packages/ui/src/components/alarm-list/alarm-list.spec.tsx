import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { must } from '../../utils/must';
import { AlarmList } from './alarm-list';
import { DEMO_ALARMS, DEMO_NOW } from './alarm-list.fixtures';
import { ago, alarmName, sortAlarms, type Alarm } from './alarm-model';

const NOW = Date.parse(DEMO_NOW);

describe('alarm model', () => {
  it('sorts active before cleared, then priority, then newest first', () => {
    expect(sortAlarms(DEMO_ALARMS).map((a) => a.id)).toEqual([
      'a6', // P1 active, 10:29:30
      'a1', // P1 active, 10:27
      'a2', // P2 active
      'a3', // P3 active, 09:48
      'a7', // P3 active, 09:00
      'a5', // P4 active
      'a4', // cleared, last
    ]);
  });

  it('ages read like people talk', () => {
    expect(ago('2026-11-03T10:29:45Z', NOW)).toBe('just now');
    expect(ago('2026-11-03T10:27:00Z', NOW)).toBe('3 min ago');
    expect(ago('2026-11-03T07:30:00Z', NOW)).toBe('3 h ago');
  });

  it('the row name: priority first, state words, age last', () => {
    expect(alarmName(must(DEMO_ALARMS[3]), NOW)).toBe(
      'Priority 2, FT-1010, Flow deviation, Line 1 · A → B, cleared, unacknowledged, 2 h ago',
    );
  });
});

function Live({ onShelve }: { onShelve?: (ids: string[], m: number) => void }) {
  const [alarms, setAlarms] = useState<Alarm[]>(DEMO_ALARMS);
  return (
    <>
      <AlarmList
        aria-label="Active alarms"
        alarms={alarms}
        now={DEMO_NOW}
        onAcknowledge={(ids) =>
          setAlarms((all) =>
            all.map((a) =>
              ids.includes(a.id) ? { ...a, acknowledged: true } : a,
            ),
          )
        }
        onShelve={onShelve}
      />
      <button
        type="button"
        onClick={() =>
          setAlarms((all) => [
            ...all,
            {
              id: 'new',
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
        Raise
      </button>
    </>
  );
}

const list = () => screen.getByRole('grid', { name: 'Active alarms' });
const rows = () => within(list()).getAllByRole('row');

describe('AlarmList', () => {
  it('lists unshelved alarms in order, and counts unacked and shelved', () => {
    render(<Live />);
    expect(rows()).toHaveLength(6); // a7 is shelved
    expect(
      must(rows()[0]).getAttribute('aria-label') ?? must(rows()[0]).textContent,
    ).toMatch(/Tank 2 level low-low/);
    expect(screen.getByText('4 unacknowledged')).toBeTruthy();
    expect(screen.getByText(/1 shelved/)).toBeTruthy();
  });

  it('a row Ack button acknowledges just that alarm', async () => {
    const user = userEvent.setup();
    render(<Live />);
    await user.click(
      screen.getByRole('button', { name: 'Acknowledge PT-2042' }),
    );
    expect(
      screen.queryByRole('button', { name: 'Acknowledge PT-2042' }),
    ).toBeNull();
    expect(screen.getByText('3 unacknowledged')).toBeTruthy();
  });

  it('with nothing ticked, the toolbar acknowledges all; with ticks, only those', async () => {
    const user = userEvent.setup();
    render(<Live />);
    // Tick the first row (Tank 2 low-low) with its checkbox.
    const first = must(rows()[0]);
    await user.click(within(first).getByRole('checkbox'));
    // The box shows the tick (it reads the row's data-selected through `group`).
    expect(first.getAttribute('data-selected')).toBe('true');
    expect(first.classList.contains('group')).toBe(true);
    await user.click(
      screen.getByRole('button', { name: 'Acknowledge 1 selected' }),
    );
    expect(screen.getByText('3 unacknowledged')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Acknowledge all' }));
    expect(screen.getByText('0 unacknowledged')).toBeTruthy();
    expect(
      (
        screen.getByRole('button', {
          name: 'Acknowledge all',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it('Shelve needs a selection, then passes ids and minutes', async () => {
    const user = userEvent.setup();
    const onShelve = vi.fn();
    render(<Live onShelve={onShelve} />);
    expect(
      (
        screen.getByRole('button', {
          name: /Shelve \(select alarms first\)/,
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    await user.click(within(must(rows()[5])).getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Shelve 1 selected' }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'For 1 hour' }),
    );
    expect(onShelve).toHaveBeenCalledWith(['a4'], 60);
  });

  it('a new P1 alarm is announced at once (role=alert); nothing on first render', async () => {
    const user = userEvent.setup();
    render(<Live />);
    expect(screen.getByRole('alert').textContent).toBe('');
    await user.click(screen.getByRole('button', { name: 'Raise' }));
    expect(screen.getByRole('alert').textContent).toBe(
      'New priority 1 alarm: PT-2043 Discharge pressure high-high, Station B · Pump 3',
    );
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('the prediction: nothing flashes (no animation classes on rows)', () => {
    render(<Live />);
    for (const row of rows()) {
      expect(row.outerHTML).not.toMatch(/animate-|blink|flash/);
    }
  });

  it('keyboard: ↑/↓ move between rows, → walks into the row (checkbox, then Ack)', async () => {
    const user = userEvent.setup();
    render(<Live />);
    act(() => must(rows()[0]).focus());
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(rows()[1]);
    // → walks the row's focusable children in order: checkbox, then Ack.
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(
      within(must(rows()[1])).getByRole('checkbox'),
    );
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Acknowledge PT-2042' }),
    );
  });
});
