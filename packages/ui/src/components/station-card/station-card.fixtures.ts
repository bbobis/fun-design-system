import type { Alarm } from '../alarm-list/alarm-model';
import type { StationCardProps } from './station-card';

/** "Now" for the demos and tests: Tue Nov 3, 2026, 10:30 UTC. */
export const DEMO_NOW = Date.parse('2026-11-03T10:30:00Z');

const pressure = { lowLow: 500, low: 1500, high: 6000, highHigh: 7200 };

const alarm = (
  a: Partial<Alarm> & Pick<Alarm, 'id' | 'priority' | 'tag' | 'message'>,
): Alarm => ({
  raisedAt: '2026-11-03T10:12:00Z',
  state: 'active',
  acknowledged: false,
  ...a,
});

type Station = Omit<StationCardProps, 'now'> & { id: string };

export const DEMO_STATIONS: Station[] = [
  {
    id: 'a',
    name: 'Station A',
    description: 'KP 0 · Edmonton terminal',
    href: '#station-a',
    equipment: [
      {
        id: 'a1',
        name: 'Pump 1',
        status: 'running',
        since: '2026-11-01T06:00:00Z',
      },
      {
        id: 'a2',
        name: 'Pump 2',
        status: 'running',
        since: '2026-11-02T18:00:00Z',
      },
      {
        id: 'a3',
        name: 'Pump 3',
        status: 'stopped',
        since: '2026-10-28T14:00:00Z',
      },
    ],
    readings: [
      {
        label: 'Discharge pressure',
        value: 4200,
        max: 8000,
        unit: 'kPa',
        thresholds: pressure,
      },
    ],
    alarms: [],
  },
  {
    id: 'b',
    name: 'Station B',
    description: 'KP 142 · Hardisty line',
    href: '#station-b',
    equipment: [
      {
        id: 'b1',
        name: 'Pump 1',
        status: 'running',
        since: '2026-11-01T06:00:00Z',
      },
      {
        id: 'b2',
        name: 'Pump 2',
        status: 'fault',
        label: 'Tripped',
        since: '2026-11-03T10:18:00Z',
      },
      {
        id: 'b3',
        name: 'Pump 3',
        status: 'starting',
        since: '2026-11-03T10:29:40Z',
      },
      {
        id: 'b4',
        name: 'Suction valve',
        status: 'running',
        since: '2026-11-01T06:00:00Z',
      },
      {
        id: 'b5',
        name: 'Discharge valve',
        status: 'running',
        since: '2026-11-01T06:00:00Z',
      },
      {
        id: 'b6',
        name: 'Meter',
        status: 'running',
        since: '2026-11-01T06:00:00Z',
      },
    ],
    readings: [
      {
        label: 'Discharge pressure',
        value: 7350,
        max: 8000,
        unit: 'kPa',
        thresholds: pressure,
      },
      {
        label: 'Suction pressure',
        value: 900,
        max: 8000,
        unit: 'kPa',
        thresholds: pressure,
      },
    ],
    alarms: [
      alarm({
        id: 'b-1',
        priority: 1,
        tag: 'PT-2042',
        message: 'Discharge pressure high-high',
        raisedAt: '2026-11-03T10:27:00Z',
      }),
      alarm({ id: 'b-2', priority: 2, tag: 'XA-2020', message: 'Pump 2 trip' }),
      alarm({
        id: 'b-3',
        priority: 3,
        tag: 'PT-2011',
        message: 'Suction pressure low',
        acknowledged: true,
      }),
    ],
  },
  {
    id: 'c',
    name: 'Station C',
    description: 'KP 288',
    href: '#station-c',
    equipment: [
      {
        id: 'c1',
        name: 'Pump 1',
        status: 'running',
        since: '2026-11-02T06:00:00Z',
      },
      {
        id: 'c2',
        name: 'Pump 2',
        status: 'maintenance',
        since: '2026-11-03T08:00:00Z',
      },
    ],
    readings: [
      {
        label: 'Discharge pressure',
        value: 3900,
        max: 8000,
        unit: 'kPa',
        thresholds: pressure,
      },
    ],
    alarms: [
      alarm({
        id: 'c-1',
        priority: 4,
        tag: 'ZS-3110',
        message: 'Pump 2 isolation valve open',
        acknowledged: true,
      }),
    ],
  },
  {
    id: 'd',
    name: 'Station D',
    description: 'KP 410 · remote',
    href: '#station-d',
    equipment: [
      {
        id: 'd1',
        name: 'Pump 1',
        status: 'comms-lost',
        since: '2026-11-03T10:24:00Z',
      },
      {
        id: 'd2',
        name: 'Pump 2',
        status: 'comms-lost',
        since: '2026-11-03T10:24:00Z',
      },
      {
        id: 'd3',
        name: 'Meter',
        status: 'comms-lost',
        since: '2026-11-03T10:24:00Z',
      },
    ],
    readings: [
      {
        label: 'Discharge pressure',
        value: 4100,
        max: 8000,
        unit: 'kPa',
        thresholds: pressure,
        stale: 'No data since 10:24',
      },
    ],
    alarms: [
      alarm({
        id: 'd-1',
        priority: 3,
        tag: 'COMM-400',
        message: 'RTU communication failure',
        raisedAt: '2026-11-03T10:24:00Z',
      }),
    ],
  },
  {
    id: 'e',
    name: 'Station E',
    description: 'KP 512',
    href: '#station-e',
    equipment: [
      {
        id: 'e1',
        name: 'Pump 1',
        status: 'running',
        since: '2026-11-03T04:00:00Z',
      },
      {
        id: 'e2',
        name: 'Pump 2',
        status: 'stopping',
        since: '2026-11-03T10:29:00Z',
      },
    ],
    readings: [
      {
        label: 'Discharge pressure',
        value: 6300,
        max: 8000,
        unit: 'kPa',
        thresholds: pressure,
      },
    ],
    alarms: [
      alarm({
        id: 'e-1',
        priority: 3,
        tag: 'PT-5042',
        message: 'Discharge pressure high',
        raisedAt: '2026-11-03T10:21:00Z',
      }),
      alarm({
        id: 'e-2',
        priority: 2,
        tag: 'TT-5051',
        message: 'Motor temperature high',
        shelvedUntil: '2026-11-03T11:00:00Z',
      }),
    ],
  },
  {
    id: 'f',
    name: 'Station F',
    description: 'KP 640 · Regina delivery',
    href: '#station-f',
    equipment: [
      {
        id: 'f1',
        name: 'Pump 1',
        status: 'stopped',
        since: '2026-11-02T22:00:00Z',
      },
      {
        id: 'f2',
        name: 'Pump 2',
        status: 'stopped',
        since: '2026-11-02T22:00:00Z',
      },
    ],
    readings: [
      {
        label: 'Tank level',
        value: 62,
        unit: '%',
        thresholds: { low: 10, high: 90, highHigh: 95 },
      },
    ],
    alarms: [],
  },
];
