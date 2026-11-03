import { isShelved, type Alarm } from '../alarm-list/alarm-model';
import {
  stateSeverity,
  type EquipmentState,
} from '../equipment-status/equipment-status-model';

/** One piece of equipment on a station card. */
export type StationEquipment = {
  id: string;
  /** "Pump 1", "Suction valve". */
  name: string;
  status: EquipmentState;
  /** ISO time the state began. */
  since?: string;
  /** Replace the status word ("Tripped"). */
  label?: string;
};

export type StationHealthLevel = 'normal' | 'attention' | 'abnormal';

export type StationHealth = {
  /** The worst thing at the station decides the level. */
  level: StationHealthLevel;
  /** The level as a word: "Normal", "Needs attention", "Abnormal". */
  word: string;
  /** What's behind it: "1 fault · 2 active alarms · 1 unacknowledged", or "All normal". */
  summary: string;
};

const words: Record<StationHealthLevel, string> = {
  normal: 'Normal',
  attention: 'Needs attention',
  abnormal: 'Abnormal',
};

const count = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/**
 * Roll a station up into one level, worst first:
 *
 * - **abnormal**: any equipment in fault, or an active priority 1–2 alarm.
 * - **attention**: comms lost, equipment in maintenance, any other active alarm, or
 *   an alarm nobody has acknowledged yet (even if it cleared).
 * - **normal**: none of that.
 *
 * Shelved alarms don't count: someone hid them on purpose.
 */
export function stationHealth(
  equipment: readonly StationEquipment[],
  alarms: readonly Alarm[],
  now: number,
): StationHealth {
  const by = (s: EquipmentState) =>
    equipment.filter((e) => e.status === s).length;
  const faults = by('fault');
  const commsLost = by('comms-lost');
  const maintenance = by('maintenance');

  const visible = alarms.filter((a) => !isShelved(a, now));
  const active = visible.filter((a) => a.state === 'active');
  const urgent = active.filter((a) => a.priority <= 2).length;
  const unacked = visible.filter((a) => !a.acknowledged).length;

  const level: StationHealthLevel =
    faults > 0 || urgent > 0
      ? 'abnormal'
      : commsLost + maintenance + active.length + unacked > 0
        ? 'attention'
        : 'normal';

  const parts = [
    faults && count(faults, 'fault'),
    commsLost && `${commsLost} comms lost`,
    maintenance && `${maintenance} in maintenance`,
    active.length && count(active.length, 'active alarm'),
    unacked && `${unacked} unacknowledged`,
  ].filter(Boolean);

  return {
    level,
    word: words[level],
    summary: parts.length ? parts.join(' · ') : 'All normal',
  };
}

/** Worst first, so the card's short equipment list shows what matters. */
export function sortEquipment(
  equipment: readonly StationEquipment[],
): StationEquipment[] {
  const rank = { abnormal: 0, attention: 1, normal: 2 } as const;
  return [...equipment].sort(
    (a, b) => rank[stateSeverity[a.status]] - rank[stateSeverity[b.status]],
  );
}
