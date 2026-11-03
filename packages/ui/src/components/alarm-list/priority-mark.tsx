import { cn } from '../../utils/cn';
import type { AlarmPriority } from './alarm-model';

/**
 * Shape + number per priority, so it never rests on color. Color fades with priority
 * (ISA-101: the urgent ones should be the loud ones). Each passes 3:1 on bg.
 */
export const priorityColor: Record<AlarmPriority, string> = {
  1: 'text-danger', // ◆
  2: 'text-warning', // ▲
  3: 'text-fg', // ■
  4: 'text-fg-muted', // ●
};

/** The priority shape with its number inside. Decorative: the row says "Priority 1". */
export function PriorityMark({
  priority,
  className,
}: {
  priority: AlarmPriority;
  /** Size override (default `size-6`). */
  className?: string;
}) {
  const shape = {
    1: <path d="M10 1.5 18.5 10 10 18.5 1.5 10z" />,
    2: <path d="M10 1.75 18.75 17.75H1.25z" />,
    3: <path d="M2.75 2.75h14.5v14.5H2.75z" />,
    4: <circle cx="10" cy="10" r="8.25" />,
  }[priority];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex size-6 shrink-0',
        priorityColor[priority],
        className,
      )}
    >
      <svg
        viewBox="0 0 20 20"
        fill="var(--color-bg)"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
        className="size-full"
      >
        {shape}
      </svg>
      {/* The number in text color: readable (4.5:1) whatever the shape's color. */}
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-[0.625rem] font-bold text-fg',
          priority === 2 && 'pt-1.5',
        )}
      >
        {priority}
      </span>
    </span>
  );
}
