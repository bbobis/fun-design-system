import { useRef, type FocusEvent } from 'react';
import { ToggleButtonGroup, type Key } from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  SegmentButton,
  segmentTrack,
  type SegmentedOption,
} from './segment-parts';

export type { SegmentedOption } from './segment-parts';

export type SegmentedControlProps = {
  /** Names the control ("View"). Required: the segments alone don't say what they set. */
  'aria-label': string;
  /** The choices, 2 to about 5. */
  options: readonly SegmentedOption[];
  /** The chosen option's id (controlled). */
  value?: string;
  /** Starting choice when uncontrolled. @default the first enabled option */
  defaultValue?: string;
  /**
   * Called with the new id when the choice changes (not when the chosen segment is
   * pressed again). Never with nothing: one option is always chosen.
   */
  onChange?: (id: string) => void;
  /** @default 'md' */
  size?: 'sm' | 'md';
  /**
   * Show icons only. Each option's `label` becomes its accessible name and a tooltip.
   * Every option needs an `icon`.
   */
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Choose one of a few options that change a setting or a view: List | Grid,
 * Day | Week | Month. One is always chosen.
 *
 * Keyboard: Tab lands on the chosen segment; ←/→ move between segments, Space or Enter
 * chooses one. Arrows only move focus, so passing over "Month" doesn't load a month of
 * data on the way to "Quarter". Built on React Aria `ToggleButtonGroup` in single mode:
 * `role="radiogroup"` with `role="radio"` segments.
 *
 * Not for switching between panels of content: use Tabs for that.
 *
 * @example
 * <SegmentedControl aria-label="View" options={[{ id: 'list', label: 'List' },
 *   { id: 'grid', label: 'Grid' }]} value={view} onChange={setView} />
 */
export function SegmentedControl({
  'aria-label': ariaLabel,
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  iconOnly = false,
  disabled = false,
  className,
}: SegmentedControlProps) {
  const firstEnabled = options.find((o) => !o.disabled)?.id;
  // The current choice, so onChange only fires for a real change: React Aria reports
  // the chosen segment again when you press it a second time.
  const current = useRef(value ?? defaultValue ?? firstEnabled);
  if (value !== undefined) current.current = value;

  // It's a radiogroup, so Tab should land on the *chosen* segment (React Aria treats it
  // like a toolbar and starts on the first). When focus arrives from outside the group,
  // pass it on to the chosen segment. The capture phase runs before React Aria's own
  // focus handling.
  const onFocusCapture = (e: FocusEvent<HTMLDivElement>) => {
    const group = e.currentTarget;
    if (group.contains(e.relatedTarget as Node | null)) return; // moving inside
    const chosen = group.querySelector<HTMLElement>(
      '[role="radio"][aria-checked="true"]:not([disabled])',
    );
    if (chosen && chosen !== e.target) chosen.focus();
  };

  return (
    // The wrapper only redirects focus as it enters; it's not focusable itself.
    <div
      onFocusCapture={onFocusCapture}
      className={cn('inline-flex', className)}
    >
      <ToggleButtonGroup
        aria-label={ariaLabel}
        selectionMode="single"
        // A view switcher always has a view: pressing the chosen segment again keeps it.
        disallowEmptySelection
        selectedKeys={value === undefined ? undefined : [value]}
        defaultSelectedKeys={
          value === undefined ? [defaultValue ?? firstEnabled ?? ''] : undefined
        }
        onSelectionChange={(keys: Set<Key>) => {
          const [next] = keys;
          if (next === undefined || String(next) === current.current) return;
          current.current = String(next);
          onChange?.(String(next));
        }}
        isDisabled={disabled}
        className={segmentTrack}
      >
        {options.map((option) => (
          <SegmentButton
            key={option.id}
            option={option}
            size={size}
            iconOnly={iconOnly}
          />
        ))}
      </ToggleButtonGroup>
    </div>
  );
}
