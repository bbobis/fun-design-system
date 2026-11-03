/** 1 is the most urgent (respond now), 4 the least (ISA-18.2 style). */
export type AlarmPriority = 1 | 2 | 3 | 4;

export interface Alarm {
  /** Unique id. */
  id: string;
  priority: AlarmPriority;
  /** The instrument tag ("PT-2042"). */
  tag: string;
  /** What's wrong ("Discharge pressure high-high"). */
  message: string;
  /** Where ("Station B · Pump 2"). */
  location?: string;
  /** When it was raised, ISO 8601 date-time. */
  raisedAt: string;
  /** `active`: still in alarm. `cleared`: back to normal (it stays until acknowledged). */
  state: 'active' | 'cleared';
  /** Someone has seen it. */
  acknowledged: boolean;
  /** Shelved (hidden on purpose) until this ISO time. Shelved alarms aren't listed. */
  shelvedUntil?: string;
}

/**
 * The list order: active before cleared, then priority (1 first), then newest first.
 * The most urgent thing that's still happening is always on top.
 */
export function sortAlarms(alarms: readonly Alarm[]): Alarm[] {
  return [...alarms].sort(
    (a, b) =>
      (a.state === 'active' ? 0 : 1) - (b.state === 'active' ? 0 : 1) ||
      a.priority - b.priority ||
      Date.parse(b.raisedAt) - Date.parse(a.raisedAt),
  );
}

/** Shelved right now (until a time after `now`). */
export const isShelved = (a: Alarm, now: number) =>
  a.shelvedUntil !== undefined && Date.parse(a.shelvedUntil) > now;

/** "just now", "3 min ago", "2 h ago", "3 d ago". */
export function ago(iso: string, now: number): string {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

/**
 * The row's name for screen readers. Priority first (that's what decides what to
 * do), then tag, message, location, state, age.
 */
export function alarmName(a: Alarm, now: number): string {
  return [
    `Priority ${a.priority}`,
    a.tag,
    a.message,
    a.location,
    a.state === 'cleared' ? 'cleared' : null,
    a.acknowledged ? null : 'unacknowledged',
    ago(a.raisedAt, now),
  ]
    .filter(Boolean)
    .join(', ');
}

/** What's said when an alarm appears. */
export const newAlarmMessage = (a: Alarm) =>
  `New priority ${a.priority} alarm: ${a.tag} ${a.message}${a.location ? `, ${a.location}` : ''}`;
