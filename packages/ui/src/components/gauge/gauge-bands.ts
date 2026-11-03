/**
 * Alarm limits, ISA-18.2 style. Any can be left out. Expected order:
 * lowLow < low < high < highHigh.
 */
export interface GaugeThresholds {
  /** At or below: alarm (low-low). */
  lowLow?: number;
  /** At or below: warning (low). */
  low?: number;
  /** At or above: warning (high). */
  high?: number;
  /** At or above: alarm (high-high). */
  highHigh?: number;
}

export type GaugeBand = 'lowLow' | 'low' | 'normal' | 'high' | 'highHigh';

/** Which band a value is in. The limit itself counts as in the band (≥ high is high). */
export function bandOf(value: number, t: GaugeThresholds = {}): GaugeBand {
  if (t.highHigh !== undefined && value >= t.highHigh) return 'highHigh';
  if (t.high !== undefined && value >= t.high) return 'high';
  if (t.lowLow !== undefined && value <= t.lowLow) return 'lowLow';
  if (t.low !== undefined && value <= t.low) return 'low';
  return 'normal';
}

/** How serious a band is: drives color and icon. */
export const bandSeverity: Record<GaugeBand, 'normal' | 'warning' | 'alarm'> = {
  lowLow: 'alarm',
  low: 'warning',
  normal: 'normal',
  high: 'warning',
  highHigh: 'alarm',
};

/** Read out with the value: "6,420 kPa, high". */
export const bandWord: Record<GaugeBand, string> = {
  lowLow: 'low-low alarm',
  low: 'low',
  normal: 'normal',
  high: 'high',
  highHigh: 'high-high alarm',
};

/** Short tick labels on the track. */
export const bandTick: Record<Exclude<GaugeBand, 'normal'>, string> = {
  lowLow: 'LL',
  low: 'L',
  high: 'H',
  highHigh: 'HH',
};

/** 0–100 position of `value` on the track, clamped. */
export const percentOf = (value: number, min: number, max: number) =>
  max === min
    ? 0
    : Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

/**
 * The colored zones to draw on the track, as [from, to] percentages: warning zones
 * between L–LL and H–HH, alarm zones beyond LL and HH.
 */
export function bandZones(
  t: GaugeThresholds,
  min: number,
  max: number,
): { from: number; to: number; severity: 'warning' | 'alarm' }[] {
  const p = (v: number) => percentOf(v, min, max);
  const zones: { from: number; to: number; severity: 'warning' | 'alarm' }[] =
    [];
  if (t.lowLow !== undefined)
    zones.push({ from: 0, to: p(t.lowLow), severity: 'alarm' });
  if (t.low !== undefined)
    zones.push({
      from: t.lowLow !== undefined ? p(t.lowLow) : 0,
      to: p(t.low),
      severity: 'warning',
    });
  if (t.high !== undefined)
    zones.push({
      from: p(t.high),
      to: t.highHigh !== undefined ? p(t.highHigh) : 100,
      severity: 'warning',
    });
  if (t.highHigh !== undefined)
    zones.push({ from: p(t.highHigh), to: 100, severity: 'alarm' });
  return zones.filter((z) => z.to > z.from);
}
