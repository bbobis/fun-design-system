import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { ToggleButton } from 'react-aria-components';
import { Tooltip } from '../tooltip';

/**
 * Shared by SegmentedControl (pick one) and ToggleGroup (turn several on/off), so a
 * chosen segment and a pressed toggle look the same.
 */
export type SegmentedOption = {
  /** Stable and unique within the control. What `value` and `onChange` use. */
  id: string;
  /** The text. With `iconOnly`, it's the button's name and its tooltip instead. */
  label: string;
  /** A small icon before the label (16px). Decorative: hide it from screen readers. */
  icon?: ReactNode;
  disabled?: boolean;
};

/** The track the segments sit in. */
export const segmentTrack =
  'inline-flex gap-0.5 rounded-md border border-border bg-surface p-0.5';

export const segmentVariants = cva(
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

/** One segment or toggle: icon + label, or icon only with the label as name and tooltip. */
export function SegmentButton({
  option,
  size,
  iconOnly,
}: {
  option: SegmentedOption;
  size: 'sm' | 'md';
  iconOnly: boolean;
}) {
  const button = (
    <ToggleButton
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
    <Tooltip content={option.label} kind="label">
      {button}
    </Tooltip>
  ) : (
    button
  );
}
