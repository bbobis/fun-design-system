import { cva, type VariantProps } from 'class-variance-authority';
import { useMemo, useRef, useState, type SVGProps } from 'react';
import {
  Button,
  ComboBox as AriaComboBox,
  Input,
  ListBox,
  ListBoxItem,
  ListLayout,
  Popover,
  useFilter,
  Virtualizer,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { useFieldContext } from '../field/field-context';
import type { SelectOption } from '../select';

/** One choice in a Combobox. Same shape as a Select option. */
export type ComboboxOption = SelectOption;

/** Row height in px. Fixed, so the virtualizer can place 10,000 rows without measuring. */
const ROW_HEIGHT = 32;

// Same heights as Input / Select / Button. The wrapper draws the box; the input inside
// is borderless, so the toggle button sits inside the same border.
const fieldVariants = cva(
  [
    'flex w-full min-w-0 items-center rounded-md border border-border-strong bg-bg text-fg',
    'transition-colors',
    // Ring when the input inside has keyboard focus (same look as Input's focus-visible).
    'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring',
    'group-data-invalid:border-danger',
    'group-data-disabled:cursor-not-allowed group-data-disabled:bg-surface group-data-disabled:opacity-60',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 ps-2.5 text-sm',
        md: 'h-10 ps-3 text-sm',
        lg: 'h-12 ps-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type ComboboxProps = VariantProps<typeof fieldVariants> & {
  /** The choices. With `filter="none"`, the current server results. */
  options: readonly ComboboxOption[];
  /** The chosen option's `value` (controlled). `null` = nothing chosen. */
  value?: string | null;
  /** Starting value when uncontrolled. */
  defaultValue?: string | null;
  /** Called with the new `value` when the user picks an option (or clears the text). */
  onChange?: (value: string | null) => void;
  /**
   * How typing narrows the list:
   * - `contains` (default) / `startsWith`: filter `options` here, in the browser.
   * - `none`: show `options` as given. Use it for server search: listen to
   *   `onInputChange`, fetch, and pass the results back in as `options`.
   */
  filter?: 'contains' | 'startsWith' | 'none';
  /**
   * Called when the text changes: as the user types, and when the text snaps to the
   * picked option's label. For server search, fetch with it (debounced).
   * The text itself is owned by the Combobox on purpose (no `inputValue` prop):
   * it must always fall back to the selected label, and only the Combobox knows when.
   */
  onInputChange?: (value: string) => void;
  /** Results are on their way: shows "Loading…" or a spinner. @default false */
  loading?: boolean;
  /** Shown in the list when nothing matches. @default 'No matches' */
  emptyMessage?: string;
  /** Called when focus leaves the control (React Hook Form uses this for "touched"). */
  onBlur?: () => void;
  placeholder?: string;
  /** Form field name. Posts the chosen option's `value`, not the typed text. */
  name?: string;
  /** Marks the control invalid. Inside a Field, set for you when it has an `error`. */
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  /** id of the input. Inside a Field, the Field's control id. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Classes for the outer wrapper (width, margins). */
  className?: string;
};

/**
 * Pick one value from a long or searchable list: type to narrow it, arrows to move,
 * Enter to pick, Esc to close (then to clear the text). Built on React Aria's
 * `ComboBox` (ARIA "editable combobox with list autocomplete"): focus stays in the
 * input; the highlighted option is announced through `aria-activedescendant`.
 *
 * The list is virtualized, so 10,000 options stay fast. For a handful of fixed choices
 * where typing isn't useful, use Select.
 */
export function Combobox({
  options,
  value,
  defaultValue = null,
  onChange,
  filter = 'contains',
  onInputChange,
  loading = false,
  emptyMessage = 'No matches',
  onBlur,
  placeholder,
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
}: ComboboxProps) {
  const field = useFieldContext();
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;

  // We always control React Aria's value, so we always know what's selected (needed
  // for the pinning below), whether the app controls it or not.
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value !== undefined ? value : internalValue;

  // Remember the label of every option we've been given. With server search, the
  // selected option often isn't in the latest results; without its label, React Aria
  // would empty the input on blur while the value stayed set.
  const labels = useRef(new Map<string, string>());
  for (const o of options) labels.current.set(o.value, o.label);

  const items = useMemo(() => {
    if (currentValue == null || options.some((o) => o.value === currentValue))
      return options;
    const label = labels.current.get(currentValue);
    // Pin the selected option at the top, so its text survives new results.
    return label === undefined
      ? options
      : [{ value: currentValue, label }, ...options];
  }, [options, currentValue]);

  const { contains, startsWith } = useFilter({ sensitivity: 'base' });
  const defaultFilter =
    filter === 'none'
      ? () => true
      : filter === 'startsWith'
        ? startsWith
        : contains;

  return (
    <AriaComboBox
      // React Aria only filters `defaultItems`; `items` means "already filtered by the app".
      // So: browser search → defaultItems (React Aria filters), server search → items.
      {...(filter === 'none' ? { items } : { defaultItems: items })}
      value={currentValue}
      onChange={(key) => {
        const next = key == null ? null : String(key);
        setInternalValue(next);
        onChange?.(next);
      }}
      // Text stays uncontrolled: React Aria then shows the picked label and resets
      // half-typed text on blur by itself. (Controlled, it would leave both to us.)
      onInputChange={onInputChange}
      defaultFilter={defaultFilter}
      // Open the list to show "No matches" / "Loading…" instead of nothing.
      allowsEmptyCollection
      // Post the option's value, not the visible text.
      formValue="key"
      name={name}
      onBlur={onBlur}
      isInvalid={invalid ?? field?.invalid ?? false}
      isRequired={required ?? field?.required ?? false}
      isDisabled={disabled ?? field?.disabled ?? false}
      validationBehavior="aria"
      disabledKeys={options.filter((o) => o.disabled).map((o) => o.value)}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <div className={fieldVariants({ size })}>
        <Input
          id={id ?? field?.controlId}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-fg-muted"
        />
        {loading && items.length > 0 && (
          <SpinnerIcon className="size-4 shrink-0 animate-spin text-fg-muted" />
        )}
        {/* Opens the full list with the mouse. React Aria keeps it out of the Tab order. */}
        <Button className="flex h-full shrink-0 items-center px-2 text-fg-muted hover:text-fg">
          <ChevronIcon className="size-4" />
        </Button>
      </div>
      <Popover
        offset={4}
        className="w-(--trigger-width) min-w-40 rounded-md border border-border bg-bg shadow-lg"
      >
        {/*
          React Aria's own virtualizer: only the visible rows are in the DOM. Rows must be
          ROW_HEIGHT tall (h-8 below) so the layout's maths matches what's drawn.
        */}
        <Virtualizer
          layout={ListLayout}
          layoutOptions={{ rowHeight: ROW_HEIGHT, padding: 4 }}
        >
          <ListBox<ComboboxOption>
            className="max-h-72 overflow-auto outline-hidden"
            renderEmptyState={() => (
              <p className="px-3 py-2 text-sm text-fg-muted">
                {loading ? 'Loading…' : emptyMessage}
              </p>
            )}
          >
            {(option) => (
              <ListBoxItem
                id={option.value}
                textValue={option.label}
                className={cn(
                  'mx-1 flex h-8 cursor-default items-center justify-between gap-2 rounded px-2 text-sm text-fg outline-hidden',
                  'data-focused:bg-surface data-selected:font-medium',
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
        </Virtualizer>
      </Popover>
    </AriaComboBox>
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

function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      {...props}
    >
      <path d="M8 2a6 6 0 1 0 6 6" />
    </svg>
  );
}
