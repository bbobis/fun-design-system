import { render, screen, within } from '@testing-library/react';
import type { Alarm } from '../alarm-list/alarm-model';
import { StationCard } from './station-card';
import { DEMO_NOW, DEMO_STATIONS } from './station-card.fixtures';
import {
  sortEquipment,
  stationHealth,
  type StationEquipment,
} from './station-health';

const NOW = DEMO_NOW;
const pump = (
  status: StationEquipment['status'],
  id: string = status,
): StationEquipment => ({
  id,
  name: `Pump ${id}`,
  status,
});
const alarm = (p: Partial<Alarm> = {}): Alarm => ({
  id: 'x',
  priority: 3,
  tag: 'PT-1',
  message: 'High',
  raisedAt: '2026-11-03T10:00:00Z',
  state: 'active',
  acknowledged: true,
  ...p,
});
const station = (id: string) => {
  const s = DEMO_STATIONS.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

describe('stationHealth', () => {
  it('all running, no alarms: normal', () => {
    expect(stationHealth([pump('running'), pump('stopped')], [], NOW)).toEqual({
      level: 'normal',
      word: 'Normal',
      summary: 'All normal',
    });
  });

  it('a fault or an active priority 1–2 alarm is abnormal', () => {
    expect(stationHealth([pump('fault')], [], NOW).level).toBe('abnormal');
    expect(stationHealth([], [alarm({ priority: 2 })], NOW).level).toBe(
      'abnormal',
    );
    // A cleared P1 isn't happening any more: attention (it's still unacknowledged).
    expect(
      stationHealth(
        [],
        [alarm({ priority: 1, state: 'cleared', acknowledged: false })],
        NOW,
      ).level,
    ).toBe('attention');
  });

  it('comms lost, maintenance, a P3–4 alarm or an unacknowledged one need attention', () => {
    expect(stationHealth([pump('comms-lost')], [], NOW).level).toBe(
      'attention',
    );
    expect(stationHealth([pump('maintenance')], [], NOW).level).toBe(
      'attention',
    );
    expect(stationHealth([], [alarm({ priority: 4 })], NOW).level).toBe(
      'attention',
    );
  });

  it('shelved alarms do not count: someone hid them on purpose', () => {
    const shelved = alarm({
      priority: 1,
      acknowledged: false,
      shelvedUntil: '2026-11-03T11:00:00Z',
    });
    expect(stationHealth([], [shelved], NOW).level).toBe('normal');
    // ...until the shelf time passes.
    const expired = { ...shelved, shelvedUntil: '2026-11-03T10:00:00Z' };
    expect(stationHealth([], [expired], NOW).level).toBe('abnormal');
  });

  it('summary counts what is behind the level, with plurals', () => {
    const h = stationHealth(
      [pump('fault', 'a'), pump('fault', 'b'), pump('comms-lost')],
      [alarm({ id: '1', acknowledged: false }), alarm({ id: '2' })],
      NOW,
    );
    expect(h.summary).toBe(
      '2 faults · 1 comms lost · 2 active alarms · 1 unacknowledged',
    );
  });
});

describe('sortEquipment', () => {
  it('puts the worst first, keeping order otherwise', () => {
    const sorted = sortEquipment([
      pump('running', '1'),
      pump('comms-lost', '2'),
      pump('stopped', '3'),
      pump('fault', '4'),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(['4', '2', '1', '3']);
  });
});

describe('StationCard', () => {
  it('the link is named just by the station, and described by the health line (the prediction)', () => {
    render(<StationCard {...station('b')} now={NOW} />);
    // RTL computes the description the way browsers do (from aria-describedby).
    expect(
      screen.getByRole('link', {
        name: 'Station B',
        description: 'Abnormal: 1 fault · 3 active alarms · 2 unacknowledged',
      }),
    ).toBeTruthy();
  });

  it('is an article named by its heading', () => {
    render(<StationCard {...station('a')} now={NOW} />);
    expect(screen.getByRole('article', { name: 'Station A' })).toBeTruthy();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Station A' }),
    ).toBeTruthy();
  });

  it('without href it is not a link', () => {
    render(<StationCard {...station('a')} href={undefined} now={NOW} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('lists equipment worst first, up to maxEquipment, then "+N more"', () => {
    render(<StationCard {...station('b')} now={NOW} />);
    const list = screen.getByRole('list', { name: 'Equipment' });
    const imgs = within(list).getAllByRole('img');
    expect(imgs).toHaveLength(4);
    expect(
      within(list).getByRole('img', {
        name: 'Pump 2: Tripped, for 12 minutes',
      }),
    ).toBe(imgs[0]);
    expect(within(list).getByText('+2 more')).toBeTruthy();
  });

  it('equipment icons are not Tab stops: the card is one', () => {
    render(<StationCard {...station('b')} now={NOW} />);
    const list = screen.getByRole('list', { name: 'Equipment' });
    for (const img of within(list).getAllByRole('img')) {
      expect(img.hasAttribute('tabindex')).toBe(false);
    }
  });

  it('counts active alarms by priority, in words for screen readers', () => {
    render(<StationCard {...station('b')} now={NOW} />);
    const list = screen.getByRole('list', {
      name: 'Active alarms by priority',
    });
    // The shapes are decoration; each item says its priority and count in words.
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    for (const p of [1, 2, 3]) {
      expect(within(list).getByText(`Priority ${p}: 1`).className).toContain(
        'sr-only',
      );
    }
  });

  it('says "No active alarms" when there are none (shelved ones included)', () => {
    render(
      <StationCard
        {...station('a')}
        alarms={[alarm({ priority: 1, shelvedUntil: '2026-11-03T11:00:00Z' })]}
        now={NOW}
      />,
    );
    expect(screen.getByText('No active alarms')).toBeTruthy();
  });

  it('shows one small gauge per reading', () => {
    render(<StationCard {...station('b')} now={NOW} />);
    expect(screen.getAllByRole('meter')).toHaveLength(2);
  });

  it('the stripe follows the level and is hidden from screen readers', () => {
    const { container } = render(<StationCard {...station('d')} now={NOW} />);
    const s = container.querySelector('[data-health]');
    expect(s?.getAttribute('data-health')).toBe('attention');
    expect(s?.getAttribute('aria-hidden')).toBe('true');
  });
});
