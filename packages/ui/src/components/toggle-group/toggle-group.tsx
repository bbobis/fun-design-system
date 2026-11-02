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
  size?: 'sm' | 'md' | 'lg';
  /** `pill`: a round track and round segments. @default 'rounded' */
  shape?: 'rounded' | 'pill';
  /**
   * How the chosen segment looks: `raised` (white, lifted) or `primary` (filled with
   * the brand color, for a control that should stand out). @default 'raised'
   */
  variant?: 'raised' | 'primary';
  /** Stretch to the container's width; the segments share it equally. @default false */
  fullWidth?: boolean;
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
  shape = 'rounded',
  variant = 'raised',
  fullWidth = false,
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
      className={cn(segmentTrack({ shape, fullWidth }), className)}
      // Inside a Toolbar, React Aria switches the role from `toolbar` to `group` but
      // keeps aria-orientation, which `group` doesn't allow (axe: aria-allowed-attr).
      // `render` lets us adjust the props before the <div> is made: drop it there.
      // The toolbar around it still says its direction, and the arrow keys don't
      // depend on the attribute (React Aria handles them in JavaScript).
      render={({ 'aria-orientation': orientation, ...props }) => (
        <div
          {...props}
          aria-orientation={props.role === 'group' ? undefined : orientation}
        />
      )}
    >
      {options.map((option) => (
        <SegmentButton
          key={option.id}
          option={option}
          size={size}
          shape={shape}
          variant={variant}
          iconOnly={iconOnly}
        />
      ))}
    </ToggleButtonGroup>
  );
}
