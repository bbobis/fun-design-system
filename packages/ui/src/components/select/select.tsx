import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode, SVGProps } from 'react';
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
import { fieldSurface } from '../field/field-surface';
import { popoverMotion } from '../../utils/motion';
import {
  hasDescriptions,
  listRowClass,
  listRowText,
  OptionContent,
  optionRowClass,
} from './option-content';

/** One choice in a Select. */
export type SelectOption = {
  /** What `value` / `onChange` use, and what a form posts. Unique per Select. */
  value: string;
  /** Visible text. Also what typeahead matches ("P" jumps to "Paid"). */
  label: string;
  /** Shown but can't be picked. @default false */
  disabled?: boolean;
  /**
   * A small icon before the label (a flag, a status dot). Decoration: hidden from
   * screen readers, so the label must say it all. In a Select, the chosen option's
   * icon also shows in the closed field.
   */
  icon?: ReactNode;
  /**
   * A grey second line ("Can change billing and users"). Screen readers read it after
   * the label. Kept to one line: longer text is cut with "…".
   */
  description?: string;
};

// Same heights and padding as Input and Button, so they line up in a row.
const triggerVariants = cva(
  [
    'flex w-full min-w-0 items-center justify-between gap-2 rounded-md text-start text-fg',
    'transition-colors',
    // Keyboard focus ring, same as Input. No outline-none (see component-recipe.md).
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
    // The Select root (the `group`) carries React Aria's state attributes.
    'group-data-invalid:border-danger',
    'disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60',
  ],
  {
    variants: {
      // Same look as Input's `variant` (field-surface.ts).
      variant: fieldSurface,
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
);

export type SelectProps = VariantProps<typeof triggerVariants> & {
  /** A small icon before the value (a globe for "Country"). Decoration: hidden from screen readers. */
  startIcon?: ReactNode;
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
  variant,
  startIcon,
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
  const listSize = size ?? 'md';
  const rows = hasDescriptions(options) ? 'described' : 'plain';
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
      // false on purpose: React Aria's only own check here is `required`, and the app
      // owns that message (component-recipe.md, rule 24).
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
      <Button
        id={id ?? field?.controlId}
        className={triggerVariants({ size, variant })}
      >
        {startIcon && (
          <span
            aria-hidden="true"
            className="flex size-4 shrink-0 text-fg-muted [&_svg]:size-full"
          >
            {startIcon}
          </span>
        )}
        <SelectValue<SelectOption> className="me-auto flex min-w-0 items-center gap-2 data-placeholder:text-fg-muted">
          {({
            selectedItems,
            selectedText,
            isPlaceholder,
            defaultChildren,
          }) => {
            // The chosen option's icon, unless the field has its own startIcon.
            const chosenIcon = startIcon ? null : selectedItems[0]?.icon;
            return (
              <>
                {chosenIcon && (
                  <span
                    aria-hidden="true"
                    className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-full"
                  >
                    {chosenIcon}
                  </span>
                )}
                {/* The label only: never the option's description or check. */}
                <span className="truncate">
                  {isPlaceholder ? defaultChildren : selectedText}
                </span>
              </>
            );
          }}
        </SelectValue>
        <ChevronIcon className="size-4 shrink-0 text-fg-muted" />
      </Button>
      {/*
        React Aria positions the popover (it sets top/left itself) and exposes the
        trigger's width as --trigger-width, so the list matches the button.
      */}
      <Popover
        offset={4}
        className={cn(
          'w-(--trigger-width) min-w-40 rounded-md border border-border bg-bg shadow-lg',
          popoverMotion,
        )}
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
                optionRowClass,
                // The list matches the field: sm field, compact rows.
                listRowClass[rows][listSize],
                listRowText[listSize],
              )}
            >
              {({ isSelected }) => (
                <OptionContent option={option} isSelected={isSelected} />
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
