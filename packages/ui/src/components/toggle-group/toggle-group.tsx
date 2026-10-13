import { ToggleButtonGroup, type Key } from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  SegmentButton,
  segmentTrack,
  type SegmentedOption,
} from '../segmented-control/segment-parts';

export type ToggleOption = SegmentedOption;

export type ToggleGroupProps = {
  /** Names the group ("Text style", "Show"). Required. */
  'aria-label': string;
  /** The toggles, 2 to about 6. */
  options: readonly ToggleOption[];
  /** The ids that are on (controlled). */
  value?: readonly string[];
  /** The ids that start on when uncontrolled. @default [] */
  defaultValue?: readonly string[];
  /** Called with every id that's on, after any toggle. Can be empty. */
  onChange?: (ids: string[]) => void;
  /** @default 'md' */
  size?: 'sm' | 'md';
  /** Icons only; each `label` becomes the button's name and its tooltip. */
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Several on/off buttons in a row: Bold | Italic | Underline, or which statuses to show.
 * Any number can be on, including none. For exactly one of several, use
 * SegmentedControl.
 *
 * Each button is a toggle (`aria-pressed`), so screen readers say "Bold, toggle
 * button, pressed". Keyboard: one Tab stop, ←/→ move, Space/Enter toggles.
 * Built on React Aria `ToggleButtonGroup` (`selectionMode="multiple"`). Inside our
 * Toolbar it becomes a group of the toolbar, sharing its arrow keys.
 *
 * @example
 * <ToggleGroup aria-label="Text style" iconOnly value={styles} onChange={setStyles}
 *   options={[{ id: 'bold', label: 'Bold', icon: <BoldIcon /> }, …]} />
 */
export function ToggleGroup({
  'aria-label': ariaLabel,
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  iconOnly = false,
  disabled = false,
  className,
}: ToggleGroupProps) {
  return (
    <ToggleButtonGroup
      aria-label={ariaLabel}
      selectionMode="multiple"
      selectedKeys={value}
      defaultSelectedKeys={
        value === undefined ? (defaultValue ?? []) : undefined
      }
      onSelectionChange={(keys: Set<Key>) =>
        // Keep the options' order, not the order they were pressed in.
        onChange?.(options.map((o) => o.id).filter((id) => keys.has(id)))
      }
      isDisabled={disabled}
      className={cn(segmentTrack, className)}
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
  );
}
