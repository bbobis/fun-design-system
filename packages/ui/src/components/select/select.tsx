import { cva, type VariantProps } from 'class-variance-authority';
import type { SVGProps } from 'react';
import {
  Button,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';

/** One choice in a Select. */
export type SelectOption = {
  /** What `value` / `onChange` use, and what a form posts. Unique per Select. */
  value: string;
  /** Visible text. Also what typeahead matches ("P" jumps to "Paid"). */
  label: string;
  /** Shown but can't be picked. @default false */
  disabled?: boolean;
};

// Same heights and padding as Input and Button, so they line up in a row.
const triggerVariants = cva(
  [
    'flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border-strong bg-bg text-start text-fg',
    'transition-colors',
    // Keyboard focus ring, same as Input. No outline-none (see component-recipe.md).
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    // The Select root (the `group`) carries React Aria's state attributes.
    'group-data-invalid:border-danger',
    'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type SelectProps = VariantProps<typeof triggerVariants> & {
  /** The choices, in display order. */
  options: readonly SelectOption[];
  /** The chosen option's `value` (controlled). `null` = nothing chosen. */
  value?: string | null;
  /** Starting value when uncontrolled. */
  defaultValue?: string | null;
  /** Called with the new `value` when the user picks an option. */
  onChange?: (value: string | null) => void;
  /** Called when focus leaves the control (React Hook Form uses this for "touched"). */
  onBlur?: () => void;
  /** Shown while nothing is chosen. Not a label: use Field or aria-label too. */
  placeholder?: string;
  /** Form field name. Renders a hidden native `<select>`, so plain form posts work. */
  name?: string;
  /** Marks the control invalid. Inside a Field, set for you when it has an `error`. */
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** id of the trigger button. Inside a Field, the Field's control id. */
  id?: string;
  /** Accessible name when there's no visible label. */
  'aria-label'?: string;
  /** id(s) of the element(s) that name it. Inside a Field, the Field's label. */
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Classes for the outer wrapper (width, margins). */
  className?: string;
};

/**
 * Pick one value from a short-to-medium list. Built on React Aria's `Select`, so it
 * follows the ARIA "select-only combobox" pattern: the trigger is a button, the list is
 * a listbox, arrow keys move, typing a letter jumps to a match, Enter or Space picks,
 * Escape closes, and focus returns to the trigger.
 *
 * For long lists or search, use Combobox (coming next).
 */
export function Select({
  options,
  value,
  defaultValue,
  onChange,
  onBlur,
  placeholder = 'Select…',
  name,
  size,
  invalid,
  required,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
}: SelectProps) {
  const field = useFieldContext();
  // Explicit props win over the Field's values (same rule as Input).
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;

  return (
    <AriaSelect
      // React Aria uses "keys"; ours are always strings, so convert at the boundary.
      value={value}
      defaultValue={defaultValue}
      onChange={(key) => onChange?.(key == null ? null : String(key))}
      onBlur={onBlur}
      placeholder={placeholder}
      name={name}
      isInvalid={invalid ?? field?.invalid ?? false}
      isRequired={required ?? field?.required ?? false}
      isDisabled={disabled ?? field?.disabled ?? false}
      // "aria": report invalid to assistive tech, but don't block native form submit.
      // Validation messages come from our Field, not the browser.
      validationBehavior="aria"
      disabledKeys={options.filter((o) => o.disabled).map((o) => o.value)}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <Button id={id ?? field?.controlId} className={triggerVariants({ size })}>
        <SelectValue className="truncate data-placeholder:text-fg-muted" />
        <ChevronIcon className="size-4 shrink-0 text-fg-muted" />
      </Button>
      {/*
        React Aria positions the popover (it sets top/left itself) and exposes the
        trigger's width as --trigger-width, so the list matches the button.
      */}
      <Popover
        offset={4}
        className="w-(--trigger-width) min-w-40 rounded-md border border-border bg-bg shadow-lg"
      >
        <ListBox
          items={options}
          className="max-h-72 overflow-auto p-1 outline-hidden"
        >
          {(option) => (
            <ListBoxItem
              id={option.value}
              textValue={option.label}
              className={cn(
                'flex cursor-default items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-fg outline-hidden',
                // data-focused = the highlighted option (keyboard or mouse).
                'data-focused:bg-surface',
                'data-selected:font-medium',
                'data-disabled:cursor-not-allowed data-disabled:text-fg-muted data-disabled:opacity-60',
              )}
            >
              {({ isSelected }) => (
                <>
                  <span className="truncate">{option.label}</span>
                  {isSelected && <CheckIcon className="size-4 shrink-0" />}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}
