import type { ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
  FieldError,
  Label,
  Text,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export type CheckboxGroupProps = {
  /** The question over the choices ("Send copies to"). It names the group. */
  label: ReactNode;
  description?: ReactNode;
  /** Error message. Marks the group invalid; read out with the group. */
  error?: ReactNode;
  /** The checked values (controlled). */
  value?: readonly string[];
  /** Starting values when uncontrolled. */
  defaultValue?: readonly string[];
  /** Called with the full list of checked values. */
  onChange?: (value: string[]) => void;
  /** Form field name. Posts one entry per checked value. */
  name?: string;
  /** @default 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  /** At least one must be checked. */
  required?: boolean;
  disabled?: boolean;
  /** `CheckboxGroupItem` elements. */
  children: ReactNode;
  className?: string;
};

/**
 * Pick any number of a few visible choices. Each box is its own Tab stop (unlike radios),
 * Space toggles it. Built on React Aria `CheckboxGroup`: the group is named by `label`,
 * and `description` / `error` are linked to it.
 *
 * Same label props as Field and RadioGroup (recipe rule 23). For one standalone box
 * ("I accept the terms"), use `Checkbox`.
 */
export function CheckboxGroup({
  label,
  description,
  error,
  value,
  defaultValue,
  onChange,
  name,
  orientation = 'vertical',
  required = false,
  disabled = false,
  children,
  className,
}: CheckboxGroupProps) {
  return (
    <AriaCheckboxGroup
      value={value ? [...value] : undefined}
      defaultValue={defaultValue ? [...defaultValue] : undefined}
      onChange={onChange}
      name={name}
      isRequired={required}
      isDisabled={disabled}
      // Boolean(error), so never undefined: React Aria's own `required` check would
      // show its default message; the app owns that (component-recipe.md, rule 24).
      isInvalid={Boolean(error)}
      validationBehavior="aria"
      className={cn('flex flex-col gap-2', className)}
    >
      <Label className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-fg-danger">
            *
          </span>
        )}
      </Label>
      {description && (
        <Text slot="description" className="-mt-1 text-sm text-fg-muted">
          {description}
        </Text>
      )}
      <div
        className={cn(
          'flex gap-x-6 gap-y-2',
          orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        )}
      >
        {children}
      </div>
      <FieldError className="text-sm text-fg-danger">{error}</FieldError>
    </AriaCheckboxGroup>
  );
}

export type CheckboxGroupItemProps = {
  /** The value this box adds to the group when checked. */
  value: string;
  /** Visible text; also the box's name. */
  children: ReactNode;
  /** A second line under the label. */
  description?: ReactNode;
  disabled?: boolean;
};

/** One box in a CheckboxGroup. Looks exactly like `Checkbox`. */
export function CheckboxGroupItem({
  value,
  children,
  description,
  disabled,
}: CheckboxGroupItemProps) {
  return (
    <AriaCheckbox
      value={value}
      isDisabled={disabled}
      className="group flex cursor-pointer items-start gap-2 text-sm text-fg data-disabled:cursor-not-allowed data-disabled:opacity-50"
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-border-strong bg-bg transition-colors',
          'group-hover:border-fg',
          'group-data-selected:border-primary group-data-selected:bg-primary',
          'group-data-invalid:border-danger',
          'group-data-focus-visible:outline-2 group-data-focus-visible:outline-offset-2 group-data-focus-visible:outline-solid group-data-focus-visible:outline-focus-ring',
        )}
      >
        {/* The same tick as Checkbox. */}
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3 text-on-primary opacity-0 group-data-selected:opacity-100"
        >
          <path d="m2.5 6.5 2.25 2L9.5 3.5" />
        </svg>
      </span>
      <span className="flex flex-col">
        <span>{children}</span>
        {description && <span className="text-fg-muted">{description}</span>}
      </span>
    </AriaCheckbox>
  );
}
