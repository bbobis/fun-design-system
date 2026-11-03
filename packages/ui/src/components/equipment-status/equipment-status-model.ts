/** What a piece of equipment (pump, valve, compressor, meter) is doing right now. */
export type EquipmentState =
  | 'running'
  | 'stopped'
  | 'starting'
  | 'stopping'
  | 'fault'
  | 'maintenance'
  | 'comms-lost';

/** The word shown (and read) for each state. */
export const stateLabel: Record<EquipmentState, string> = {
  running: 'Running',
  stopped: 'Stopped',
  starting: 'Starting',
  stopping: 'Stopping',
  fault: 'Fault',
  maintenance: 'Maintenance',
  'comms-lost': 'Comms lost',
};

/**
 * Normal or not, ISA-101 style. Only abnormal states earn color; running and
 * stopped are both *normal* (a stopped standby pump is fine), so they stay gray.
 */
export const stateSeverity: Record<
  EquipmentState,
  'normal' | 'attention' | 'abnormal'
> = {
  running: 'normal',
  stopped: 'normal',
  starting: 'normal',
  stopping: 'normal',
  maintenance: 'normal',
  'comms-lost': 'attention',
  fault: 'abnormal',
};

/**
 * Time spent in the state, short for the eye and long for the ear:
 * `{ short: '3 h', long: '3 hours' }`. Floors, so "59 min" never shows as "1 h".
 */
export function durationOf(
  sinceIso: string,
  now: number,
): { short: string; long: string } {
  const minutes = Math.max(
    0,
    Math.floor((now - Date.parse(sinceIso)) / 60_000),
  );
  const plural = (n: number, unit: string) =>
    `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (minutes < 1) return { short: '<1 min', long: 'less than a minute' };
  if (minutes < 60)
    return { short: `${minutes} min`, long: plural(minutes, 'minute') };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { short: `${hours} h`, long: plural(hours, 'hour') };
  const days = Math.floor(hours / 24);
  return { short: `${days} d`, long: plural(days, 'day') };
}
