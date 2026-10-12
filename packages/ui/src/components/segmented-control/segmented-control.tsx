import { cva } from 'class-variance-authority';
import { useRef, type FocusEvent, type ReactNode } from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Tooltip } from '../tooltip';

export type SegmentedOption = {
  /** Stable and unique within the control. What `value` and `onChange` use. */
  id: string;
  /** The text. With `iconOnly`, it's the button's name and its tooltip instead. */
  label: string;
  /** A small icon before the label (16px). Decorative: hide it from screen readers. */
  icon?: ReactNode;
  disabled?: boolean;
};

const segmentVariants = cva(
  [
    'inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded font-medium whitespace-nowrap text-fg-muted outline-hidden transition-colors',
    'hover:text-fg',
    // The chosen segment is raised: its own background, a shadow and an outline. The
    // fill alone is only 1.2:1 against the track; the border-strong ring reaches 3:1
    // (WCAG 1.4.11), so the choice is visible without relying on the text color.
    'data-selected:bg-bg data-selected:text-fg data-selected:shadow-sm data-selected:ring-1 data-selected:ring-border-strong',
    'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:hover:text-fg-muted',
    'data-focus-visible:outline-2 data-focus-visible:outline-offset-1 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
  ],
  {
    variants: {
      size: { sm: 'h-7 px-2.5 text-xs', md: 'h-8 px-3 text-sm' },
      iconOnly: { true: 'px-0', false: '' },
    },
    compoundVariants: [
      { size: 'sm', iconOnly: true, class: 'w-7' },
      { size: 'md', iconOnly: true, class: 'w-8' },
    ],
    defaultVariants: { size: 'md', iconOnly: false },
  },
);

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
        className="inline-flex gap-0.5 rounded-md border border-border bg-surface p-0.5"
      >
        {options.map((option) => {
          const segment = (
            <ToggleButton
              key={option.id}
              id={option.id}
              isDisabled={option.disabled}
              aria-label={iconOnly ? option.label : undefined}
              className={segmentVariants({ size, iconOnly })}
            >
              {option.icon && (
                <span aria-hidden="true" className="flex size-4 shrink-0">
                  {option.icon}
                </span>
              )}
              {!iconOnly && option.label}
            </ToggleButton>
          );
          // Icon-only: the label is the name already, so the tooltip only shows it
          // (kind="label": screen readers don't hear it twice).
          return iconOnly ? (
            <Tooltip key={option.id} content={option.label} kind="label">
              {segment}
            </Tooltip>
          ) : (
            segment
          );
        })}
      </ToggleButtonGroup>
    </div>
  );
}
