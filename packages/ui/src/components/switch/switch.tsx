import type { ReactNode } from 'react';
import { Switch as AriaSwitch } from 'react-aria-components';
import { cn } from '../../utils/cn';

export type SwitchProps = {
  /** What it turns on or off ("Email me when an invoice is paid"). Its name. */
  children: ReactNode;
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
  checked,
  defaultChecked,
  onChange,
  name,
  disabled,
  className,
}: SwitchProps) {
  return (
    <AriaSwitch
      isSelected={checked}
      defaultSelected={defaultChecked}
      onChange={onChange}
      name={name}
      isDisabled={disabled}
      className={cn(
        'group inline-flex cursor-pointer items-center gap-2 text-sm text-fg data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-9 shrink-0 items-center rounded-full border-[1.5px] border-border-strong bg-surface p-0.5 transition-colors',
          'group-data-selected:border-primary group-data-selected:bg-primary',
          'group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-solid group-data-focus-visible:outline-focus-ring',
        )}
      >
        <span className="size-3.5 rounded-full bg-fg-muted shadow-sm transition-transform group-data-selected:translate-x-4 group-data-selected:bg-on-primary motion-reduce:transition-none rtl:group-data-selected:-translate-x-4" />
      </span>
      {children}
    </AriaSwitch>
  );
}
