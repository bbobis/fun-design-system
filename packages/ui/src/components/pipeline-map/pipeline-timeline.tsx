import { useMemo, type ReactNode } from 'react';
import { Slider } from '../slider/slider';
import type { PipelineSnapshot } from './pipeline-model';

export type PipelineTimelineProps = {
  /** The moments to step through, oldest first. Ids must stay the same across them. */
  snapshots: readonly PipelineSnapshot[];
  /** Which snapshot is shown (controlled): pass `snapshots[index].network` to the map. */
  index: number;
  /** Called with the new index as the user drags or presses keys. */
  onIndexChange: (index: number) => void;
  /** Names the slider. @default 'Time' */
  label?: ReactNode;
  /**
   * IANA time zone for the times ("America/Edmonton", "UTC").
   * @default the viewer's own time zone
   */
  timeZone?: string;
  /**
   * Puts a snapshot's time into words. Defaults to hour and minute in the viewer's
   * locale ("6:00 AM", "06:00"); pass your own for a fixed style or to add the date.
   */
  formatTime?: (iso: string) => string;
  /** @default 'md' */
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * Steps a Pipeline Map through time: a slider over real snapshots (no tweening, no
 * guessing). The page keeps the index and gives the map `snapshots[index].network`.
 * Because ids stay the same, selection, a trace and a followed batch carry over, so
 * you can watch one batch move down the line.
 *
 * Keyboard (from our Slider): ←/→ one snapshot, Home/End the first and last. Screen
 * readers hear the time ("07:00"), not the index, and the description gives the range.
 */
export function PipelineTimeline({
  snapshots,
  index,
  onIndexChange,
  label = 'Time',
  timeZone,
  formatTime,
  size,
  className,
}: PipelineTimelineProps) {
  const format = useMemo(() => {
    if (formatTime) return formatTime;
    const f = new Intl.DateTimeFormat(undefined, {
      // The viewer's own clock style: "6:00 AM" in en-US, "06:00" in en-GB.
      hour: 'numeric',
      minute: '2-digit',
      timeZone,
    });
    return (iso: string) => f.format(new Date(iso));
  }, [formatTime, timeZone]);

  const first = snapshots[0];
  const last = snapshots.at(-1);
  const timeOf = (i: number) => {
    const snap = snapshots[i];
    return snap ? format(snap.at) : '';
  };

  return (
    <Slider
      label={label}
      min={0}
      max={Math.max(snapshots.length - 1, 0)}
      step={1}
      value={index}
      onChange={onIndexChange}
      getValueLabel={timeOf}
      description={
        first && last
          ? `${snapshots.length} snapshots, ${format(first.at)} to ${format(last.at)}`
          : 'No snapshots'
      }
      disabled={snapshots.length < 2}
      size={size}
      className={className}
    />
  );
}
