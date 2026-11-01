import { useId, type ReactNode } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  choiceLayout,
  choiceSize,
  type ChoiceSize,
  type LabelPosition,
} from '../checkbox/choice-control';

export type SwitchProps = {
  /** What it turns on or off ("Email me when an invoice is paid"). Its name. */
  children: ReactNode;
  /** A second line under the label ("Sent to billing@acme.example"). Read after the name. */
  description?: ReactNode;
  /** @default 'md' */
  size?: ChoiceSize;
  /**
   * `end` (default): switch, then label. `start`: label first, switch at the far end,
   * like a settings list.
   * @default 'end'
   */
  labelPosition?: LabelPosition;
  /** On or off (controlled). */
  checked?: boolean;
  /** Starting state when uncontrolled. @default false */
  defaultChecked?: boolean;
  /** Called with the new state right away. */
  onChange?: (checked: boolean) => void;
  /** Form field name. Posts "on" when on, like a checkbox. */
  name?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Turns a setting on or off **immediately**, like a light switch: no Save button.
 * For a choice that's only applied when a form is submitted ("I accept the terms"),
 * use a Checkbox instead.
 *
 * Space toggles it. Built on React Aria `Switch` (a native checkbox with
 * `role="switch"`, so screen readers say "on" / "off").
 */
export function Switch({
  children,
  description,
  size = 'md',
  labelPosition = 'end',
  checked,
  defaultChecked,
  onChange,
  name,
  disabled,
  className,
}: SwitchProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <AriaSwitch
      // Named by the label only; the description is read after it (like Radio).
      aria-labelledby={labelId}
      aria-describedby={description ? descriptionId : undefined}
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onChange}
      name={name}
      isDisabled={disabled}
      className={cn(
        'group cursor-pointer text-fg data-disabled:cursor-not-allowed data-disabled:opacity-50',
        labelPosition === 'end' && 'inline-flex',
        choiceLayout(labelPosition),
        choiceSize.text[size],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center rounded-full border-[1.5px] border-border-strong bg-surface p-0.5 transition-colors',
          choiceSize.track[size],
          // Sit on the label's first line, like the checkbox and radio.
          description && choiceSize.align[size],
          'group-data-selected:border-primary group-data-selected:bg-primary',
          'group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-solid group-data-focus-visible:outline-focus-ring',
        )}
      >
        <span
          className={cn(
            'rounded-full bg-fg-muted shadow-sm transition-transform group-data-selected:bg-on-primary motion-reduce:transition-none',
            choiceSize.thumb[size],
          )}
        />
      </span>
      <span className="flex flex-col">
        <span id={labelId}>{children}</span>
        {description && (
          <span id={descriptionId} className="text-fg-muted">
            {description}
          </span>
        )}
      </span>
    </AriaSwitch>
  );
}
