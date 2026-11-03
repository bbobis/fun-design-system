import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Tooltip } from '../tooltip';
import {
  durationOf,
  stateLabel,
  stateSeverity,
  type EquipmentState,
} from './equipment-status-model';

export type EquipmentStatusProps = {
  /** What the equipment is doing. Each state has its own glyph *and* word. */
  status: EquipmentState;
  /**
   * - `badge` (default): glyph + word in a pill. Fault is solid red, comms lost amber,
   *   everything else gray.
   * - `inline`: glyph + word, no pill. For table cells and dense lists.
   * - `icon`: glyph only, for maps and P&ID-style screens. Needs `name`. It is a
   *   named image ("Pump 2: Comms lost") with a tooltip on hover and keyboard focus.
   * @default 'badge'
   */
  variant?: 'badge' | 'inline' | 'icon';
  /**
   * The equipment's name ("Pump 2"). Required for `icon` (the glyph alone can't say
   * whose status it is). For `badge`/`inline` the row or card around it usually
   * names the equipment, so leave it out there.
   */
  name?: string;
  /** Replace the word, keeping the glyph ("Tripped" instead of "Fault"). */
  label?: string;
  /** ISO time the state began. With `now`, shows how long: "Fault · 12 min". */
  since?: string;
  /** "Now" in ms, for `since`. Pass it from one clock so a list ages together. @default Date.now() */
  now?: number;
  /** @default 'md' */
  size?: 'sm' | 'md';
  /** `icon` only: set `false` when a focusable row already says the status. @default true */
  tooltip?: boolean;
  className?: string;
};

/** Glyph color outside a pill. Gray for normal; color only for the abnormal (ISA-101). */
const glyphColor = {
  normal: 'text-fg-muted',
  attention: 'text-fg-warning',
  abnormal: 'text-fg-danger',
} as const;

/** The pill. Inside it the glyph uses the text color, which is made to contrast. */
const badgeColor = {
  normal: 'border-border bg-surface text-fg',
  attention: 'border-transparent bg-warning-soft text-on-warning-soft',
  abnormal: 'border-transparent bg-danger text-on-danger',
} as const;

const sizes = {
  sm: {
    text: 'text-xs',
    glyph: 'size-3',
    pill: 'gap-1 px-1.5 py-px',
    icon: 'size-4',
  },
  md: {
    text: 'text-sm',
    glyph: 'size-3.5',
    pill: 'gap-1.5 px-2 py-0.5',
    icon: 'size-5',
  },
} as const;

/**
 * The state of a pump, valve, compressor or meter, said with a **shape** and a
 * **word**, never color alone:
 *
 * ● running · ○ stopped · ◐ starting / ◑ stopping · ⯃✕ fault · 🔒 maintenance · ◌? comms lost
 *
 * Plain HTML (no React Aria needed): it's text, except the `icon` variant, which is
 * a `role="img"` with an `aria-label`.
 *
 * @example
 * <EquipmentStatus status="fault" since={trippedAt} now={now} />
 * <EquipmentStatus variant="icon" name="Pump 2" status="comms-lost" />
 */
export function EquipmentStatus({
  status,
  variant = 'badge',
  name,
  label,
  since,
  now = Date.now(),
  size = 'md',
  tooltip = true,
  className,
}: EquipmentStatusProps) {
  const word = label ?? stateLabel[status];
  const severity = stateSeverity[status];
  const time = since ? durationOf(since, now) : undefined;
  const s = sizes[size];

  if (variant === 'icon') {
    // The whole name in one string: "Pump 2: Comms lost, for 12 minutes".
    const spoken = `${name ? `${name}: ` : ''}${word}${time ? `, for ${time.long}` : ''}`;
    const glyph = (
      <span
        role="img"
        aria-label={spoken}
        data-status={status}
        tabIndex={tooltip ? 0 : undefined}
        className={cn(
          'inline-flex shrink-0 rounded-sm',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus-ring',
          s.icon,
          glyphColor[severity],
          className,
        )}
      >
        <Glyph status={status} />
      </span>
    );
    if (!tooltip) return glyph;
    return (
      // kind="label": the tooltip only repeats the name, so screen readers skip it.
      <Tooltip
        kind="label"
        content={[name, word, time?.short].filter(Boolean).join(' · ')}
      >
        {glyph}
      </Tooltip>
    );
  }

  const badge = variant === 'badge';
  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex items-center font-medium whitespace-nowrap',
        s.text,
        badge
          ? cn('rounded-full border', s.pill, badgeColor[severity])
          : cn('gap-1.5', 'text-fg'),
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('flex shrink-0', s.glyph, !badge && glyphColor[severity])}
      >
        <Glyph status={status} />
      </span>
      {name && <span className="sr-only">{name}: </span>}
      {word}
      {time && (
        <>
          {/* "3 h" is for the eye; the ear gets "for 3 hours". */}
          <span aria-hidden="true" className="font-normal opacity-80">
            · {time.short}
          </span>
          <span className="sr-only">, for {time.long}</span>
        </>
      )}
    </span>
  );
}

/**
 * One shape per state, so it reads in grayscale, for color-blind users, and on a
 * washed-out control-room screen. All `currentColor`, so the parent picks the color.
 */
function Glyph({ status }: { status: EquipmentState }) {
  const shapes: Record<EquipmentState, ReactNode> = {
    // Solid: energized.
    running: <circle cx="8" cy="8" r="6.25" fill="currentColor" />,
    // Hollow: same circle, nothing inside.
    stopped: (
      <circle
        cx="8"
        cy="8"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    ),
    // Half-filled: on its way. The filled half is the side it's heading to.
    starting: (
      <>
        <circle
          cx="8"
          cy="8"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path d="M8 2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
      </>
    ),
    stopping: (
      <>
        <circle
          cx="8"
          cy="8"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        />
        <path d="M8 2.5a5.5 5.5 0 0 0 0 11z" fill="currentColor" />
      </>
    ),
    // Octagon (a stop sign) with a cross: the one shape with corners and a mark.
    fault: (
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      >
        <path d="M5.4 1.25h5.2l3.65 3.65v5.2l-3.65 3.65H5.4L1.75 10.1V4.9z" />
        <path d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5" strokeLinecap="round" />
      </g>
    ),
    // Padlock: locked out for work (lock-out / tag-out).
    maintenance: (
      <>
        <path
          d="M5 7.25V5.5a3 3 0 0 1 6 0v1.75"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <rect
          x="2.75"
          y="7"
          width="10.5"
          height="7.5"
          rx="1.25"
          fill="currentColor"
        />
      </>
    ),
    // Dashed ring with "?": we don't know. Not the last known state.
    'comms-lost': (
      <>
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeDasharray="2.5 2"
        />
        <path
          d="M6.4 6.4a1.7 1.7 0 1 1 2.3 1.6c-.45.2-.7.55-.7 1v.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.3" r=".85" fill="currentColor" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-full">
      {shapes[status]}
    </svg>
  );
}
