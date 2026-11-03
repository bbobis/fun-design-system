import type { SVGProps } from 'react';
import { Label, Meter } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { cssVars } from '../../utils/css-vars';
import {
  bandOf,
  bandSeverity,
  bandTick,
  bandWord,
  bandZones,
  percentOf,
  type GaugeBand,
  type GaugeThresholds,
} from './gauge-bands';

export type GaugeProps = {
  /** What's measured ("Discharge pressure"). Names the meter. */
  label: string;
  /** The reading, in the gauge's unit. */
  value: number;
  /** @default 0 */
  min?: number;
  /** @default 100 */
  max?: number;
  /** Unit shown and read after the number ("kPa", "%", "m³/h"). */
  unit?: string;
  /** Alarm limits (LL, L, H, HH). The band is shown in color, icon and words. */
  thresholds?: GaugeThresholds;
  /** The target value: a small marker on the track. */
  setpoint?: number;
  /** `Intl.NumberFormat` options for the number. @default { maximumFractionDigits: 1 } */
  format?: Intl.NumberFormatOptions;
  /** BCP 47 language for numbers. @default the viewer's */
  locale?: string;
  /**
   * The reading is old (lost comms): everything goes gray and this text is shown and
   * read ("No data since 10:42"). The band isn't trusted, so it isn't colored.
   */
  stale?: string;
  /** `vertical` for tank levels. @default 'horizontal' */
  orientation?: 'horizontal' | 'vertical';
  /** @default 'md' */
  size?: 'sm' | 'md';
  className?: string;
};

/** Fill and text colors per severity. Normal is gray on purpose (ISA-101). */
const fill = {
  normal: 'bg-fg-muted',
  warning: 'bg-warning',
  alarm: 'bg-danger',
} as const;
const zone = {
  // Faint stripes, so the zones read as "a region", not as a second value.
  warning:
    'bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-warning)_30%,transparent)_0_3px,transparent_3px_6px)]',
  alarm:
    'bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-danger)_35%,transparent)_0_3px,transparent_3px_6px)]',
} as const;

/**
 * One live reading against its alarm limits: line pressure, tank level, flow.
 *
 * Following ISA-101 (HMI design for process control), a normal reading is **gray**:
 * color is kept for the abnormal, so a warning (amber, ▲) or an alarm (red, ⚠) stands
 * out on a screen full of gauges. The band is also written as a word.
 *
 * Built on React Aria's `Meter` (`role="meter"`). Screen readers hear the value with
 * its unit and band ("6,420 kPa, high"), not a percentage.
 */
export function Gauge({
  label,
  value,
  min = 0,
  max = 100,
  unit,
  thresholds,
  setpoint,
  format = { maximumFractionDigits: 1 },
  locale,
  stale,
  orientation = 'horizontal',
  size = 'md',
  className,
}: GaugeProps) {
  const band: GaugeBand = bandOf(value, thresholds);
  const severity = stale ? 'normal' : bandSeverity[band];
  const number = new Intl.NumberFormat(locale, format).format(value);
  const shown = unit ? `${number} ${unit}` : number;
  const range =
    value > max ? ', above range' : value < min ? ', below range' : '';
  const valueText = stale
    ? `${shown}, ${stale}`
    : `${shown}, ${bandWord[band]}${range}`;
  const pct = percentOf(value, min, max);
  const zones = thresholds ? bandZones(thresholds, min, max) : [];
  const ticks = thresholds
    ? (Object.keys(bandTick) as (keyof typeof bandTick)[])
        .filter((k) => thresholds[k] !== undefined)
        .map((k) => ({
          key: k,
          label: bandTick[k],
          at: percentOf(thresholds[k] as number, min, max),
        }))
    : [];
  const vertical = orientation === 'vertical';

  return (
    <Meter
      value={value}
      minValue={min}
      maxValue={max}
      valueLabel={valueText}
      // React Aria writes role="meter progressbar" (a fallback list for browsers
      // from before 2022). Every current browser knows "meter", and axe 4.13 rejects
      // the value attributes on the list, so we keep just "meter".
      render={(props) => <div {...props} role="meter" />}
      className={cn(
        'flex flex-col',
        vertical ? 'w-fit items-center gap-2' : 'gap-1',
        className,
      )}
    >
      {/*
        Label on its own line, value (one line, never wrapped) under it: in a narrow
        panel nothing gets squeezed. Tanks put this under the tank.
      */}
      <div
        className={cn(
          'flex flex-col gap-0.5',
          vertical && 'order-2 items-center text-center',
        )}
      >
        <Label
          className={cn('text-fg-muted', size === 'sm' ? 'text-xs' : 'text-sm')}
        >
          {label}
        </Label>
        {/* aria-hidden: the meter's valuetext already says all of this. */}
        <span
          aria-hidden="true"
          className={cn(
            'flex flex-wrap items-center gap-x-1.5 gap-y-0.5',
            vertical && 'justify-center',
          )}
        >
          <span
            className={cn(
              'font-semibold whitespace-nowrap tabular-nums',
              // Stale: muted text (still 4.5:1), not opacity, which would fail contrast.
              stale ? 'text-fg-muted' : 'text-fg',
              size === 'sm' ? 'text-sm' : 'text-lg',
            )}
          >
            {shown}
          </span>
          {stale ? (
            <span className="text-xs text-fg-muted italic">{stale}</span>
          ) : (
            severity !== 'normal' && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded px-1 text-xs font-semibold whitespace-nowrap',
                  severity === 'alarm'
                    ? 'bg-danger text-on-danger'
                    : 'bg-warning-soft text-on-warning-soft',
                )}
              >
                {severity === 'alarm' ? (
                  <AlarmIcon className="size-3" />
                ) : (
                  <WarnIcon className="size-3" />
                )}
                {bandWord[band]
                  .replace(' alarm', '')
                  .replace(/^./, (c) => c.toUpperCase())}
              </span>
            )
          )}
        </span>
      </div>

      {/*
        The track: zones, ticks, setpoint, fill. Decoration (the meter says it).
        Warning ticks (L, H) are labelled on one side and alarm ticks (LL, HH) on the
        other, so close limits (H 95, HH 105) never print on top of each other.
      */}
      <div
        aria-hidden="true"
        className={cn(
          'relative shrink-0 rounded-sm bg-surface ring-1 ring-border ring-inset',
          vertical
            ? cn('mx-6', size === 'sm' ? 'h-24 w-5' : 'h-36 w-7')
            : cn('my-4 w-full', size === 'sm' ? 'h-2' : 'h-3'),
        )}
      >
        {zones.map((z) => (
          <div
            key={`${z.from}-${z.severity}`}
            style={cssVars({ '--a': `${z.from}%`, '--b': `${z.to - z.from}%` })}
            className={cn(
              'absolute',
              vertical
                ? 'inset-x-0 bottom-(--a) h-(--b)'
                : 'inset-y-0 start-(--a) w-(--b)',
              zone[z.severity],
            )}
          />
        ))}
        {/* The fill: from min up to the value. */}
        <div
          data-gauge-fill={severity}
          style={cssVars({ '--p': `${pct}%` })}
          className={cn(
            'absolute rounded-sm',
            vertical
              ? 'inset-x-1 bottom-0 h-(--p)'
              : 'inset-y-0.5 start-0 w-(--p)',
            fill[severity],
          )}
        />
        {ticks.map((t) => {
          const alarm = t.key === 'lowLow' || t.key === 'highHigh';
          return (
            <div
              key={t.key}
              style={cssVars({ '--t': `${t.at}%` })}
              className={cn(
                'absolute',
                vertical
                  ? '-inset-x-1 bottom-(--t) border-t border-fg-muted'
                  : '-inset-y-1 start-(--t) border-s border-fg-muted',
              )}
            >
              <span
                className={cn(
                  'absolute text-[0.625rem] leading-none font-medium text-fg-muted',
                  vertical
                    ? cn(
                        '-top-[0.3rem]',
                        alarm ? 'end-full pe-1' : 'start-full ps-1',
                      )
                    : cn(
                        'start-0 -translate-x-1/2 rtl:translate-x-1/2',
                        alarm ? 'top-full pt-0.5' : 'bottom-full pb-0.5',
                      ),
                )}
              >
                {t.label}
              </span>
            </div>
          );
        })}
        {setpoint !== undefined && (
          <div
            style={cssVars({ '--s': `${percentOf(setpoint, min, max)}%` })}
            className={cn(
              'absolute text-fg',
              vertical
                ? 'end-full bottom-(--s) translate-y-1/2 pe-0.5'
                : 'top-full start-(--s) -translate-x-1/2 pt-0.5 rtl:translate-x-1/2',
            )}
          >
            {/* Points at the track: up from below, or right from the side. */}
            <SetpointIcon
              className={cn('size-2.5', vertical && 'rotate-90 rtl:-rotate-90')}
            />
          </div>
        )}
      </div>
    </Meter>
  );
}

const WarnIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" viewBox="0 0 12 12" fill="currentColor" {...p}>
    <path d="M6 1.5 11 10.5H1z" />
  </svg>
);
const AlarmIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    {...p}
  >
    <path d="M6 1.5 11 10.5H1z" strokeLinejoin="round" />
    <path d="M6 5v2.2M6 8.8h.01" />
  </svg>
);
const SetpointIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" viewBox="0 0 10 10" fill="currentColor" {...p}>
    <path d="M5 1 9 8H1z" />
  </svg>
);
