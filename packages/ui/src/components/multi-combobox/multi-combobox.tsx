import { cva, type VariantProps } from 'class-variance-authority';
import { useRef, useState, type KeyboardEvent } from 'react';
import {
  Button,
  ComboBox as AriaComboBox,
  Group,
  Input,
  ComboBoxValue,
  Tag,
  TagGroup,
  TagList,
  useFilter,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  ChevronIcon,
  ComboboxPopover,
  SpinnerIcon,
  XIcon,
} from '../combobox/combobox-parts';
import { useFieldContext } from '../field/field-context';
import type { SelectOption } from '../select';

/** One choice in a MultiCombobox. Same shape as a Select / Combobox option. */
export type MultiComboboxOption = SelectOption;

// The box grows taller as tags wrap, so sizes set a *minimum* height. Padding is
// chosen so one row (tags + input) is exactly as tall as Input / Select / Combobox.
const fieldVariants = cva(
  [
    'flex w-full min-w-0 cursor-text items-start rounded-md border border-border-strong bg-bg text-fg',
    'transition-colors',
    'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus-ring',
    'group-data-invalid:border-danger',
    'group-data-disabled:cursor-not-allowed group-data-disabled:bg-surface group-data-disabled:opacity-60',
  ],
  {
    variants: {
      size: {
        sm: 'min-h-8 py-0.5 ps-1 text-sm',
        md: 'min-h-10 py-1 ps-1.5 text-sm',
        lg: 'min-h-12 py-1.5 ps-2 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

// One "row" height inside the box, per size: the input and the toggle button use it.
const rowHeight = { sm: 'h-6', md: 'h-7', lg: 'h-8' } as const;

export type MultiComboboxProps = VariantProps<typeof fieldVariants> & {
  /** The choices. With `filter="none"`, the current server results. */
  options: readonly MultiComboboxOption[];
  /** The chosen options' values, in the order they were picked (controlled). */
  value?: readonly string[];
  /** Starting values when uncontrolled. */
  defaultValue?: readonly string[];
  /** Called with the full new list whenever an option is added or removed. */
  onChange?: (value: string[]) => void;
  /**
   * How typing narrows the list:
   * - `contains` (default) / `startsWith`: filter `options` here, in the browser.
   * - `none`: show `options` as given (server search; see `onInputChange`).
   */
  filter?: 'contains' | 'startsWith' | 'none';
  /** Called as the user types, and with `''` after each pick (the text clears). */
  onInputChange?: (value: string) => void;
  /** Results are on their way: shows "Loading…" or a spinner. @default false */
  loading?: boolean;
  /** Shown in the list when nothing matches. @default 'No matches' */
  emptyMessage?: string;
  /** Called when focus leaves the control (React Hook Form uses this for "touched"). */
  onBlur?: () => void;
  /** Shown only while nothing is picked. */
  placeholder?: string;
  /** Form field name. Posts one entry per picked value (`tags=a&tags=b`). */
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
 * Pick several values from a long or searchable list. Picks show as tags inside the
 * field. Type to narrow, Enter to add (the list stays open for the next pick),
 * Backspace in the empty input to remove the last tag. Tags are one Tab stop:
 * ←/→ move between them, Delete or Backspace removes one.
 *
 * Built on React Aria's `ComboBox` (`selectionMode="multiple"`) and `TagGroup`.
 * For a single value use Combobox; for a few fixed choices, a group of Checkboxes.
 */
export function MultiCombobox({
  options,
  value,
  defaultValue = [],
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
}: MultiComboboxProps) {
  const field = useFieldContext();
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;
  const isDisabled = disabled ?? field?.disabled ?? false;
  const inputRef = useRef<HTMLInputElement>(null);

  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value ?? internalValue;
  const update = (next: string[]) => {
    setInternalValue(next);
    onChange?.(next);
  };

  // Labels of every option we've seen. Tags are drawn from this, not from React Aria's
  // ComboBoxValue: that one only knows options in the *current* list, so with server
  // search every tag would vanish as soon as the results changed.
  const labels = useRef(new Map<string, string>());
  for (const o of options) labels.current.set(o.value, o.label);
  const tags = selected.map((v) => ({
    value: v,
    label: labels.current.get(v) ?? v,
  }));

  const remove = (keys: Set<Key>) => {
    update(selected.filter((v) => !keys.has(v)));
    // Removing the last tag unmounts the tag list: don't leave focus on <body>.
    if (keys.size >= selected.length) inputRef.current?.focus();
  };

  // Backspace in an empty input removes the last tag (the usual "chips" shortcut).
  const onInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === 'Backspace' &&
      e.currentTarget.value === '' &&
      selected.length > 0
    )
      update(selected.slice(0, -1));
  };

  const { contains, startsWith } = useFilter({ sensitivity: 'base' });
  const defaultFilter =
    filter === 'none'
      ? () => true
      : filter === 'startsWith'
        ? startsWith
        : contains;
  const row = rowHeight[size ?? 'md'];

  return (
    <AriaComboBox
      selectionMode="multiple"
      {...(filter === 'none' ? { items: options } : { defaultItems: options })}
      value={selected}
      onChange={(keys) => update(keys.map(String))}
      onInputChange={onInputChange}
      defaultFilter={defaultFilter}
      allowsEmptyCollection
      formValue="key"
      name={name}
      onBlur={onBlur}
      isInvalid={invalid ?? field?.invalid ?? false}
      isRequired={required ?? field?.required ?? false}
      isDisabled={isDisabled}
      validationBehavior="aria"
      disabledKeys={options.filter((o) => o.disabled).map((o) => o.value)}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <Group
        className={fieldVariants({ size })}
        // Clicking the box's empty space focuses the input, like a normal text field.
        onClick={(e) => {
          if (!(e.target as Element).closest('button, input, [role=row]'))
            inputRef.current?.focus();
        }}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {tags.length > 0 && (
            // ComboBoxValue is a "hideable" component: React Aria builds the option list by
            // rendering the ComboBox's children in a hidden pass, and hideable components
            // skip that pass. A bare TagGroup here would be rendered in it and crash.
            // We ignore its `selectedItems` (see `labels` above) and draw our own tags.
            <ComboBoxValue className="contents">
              <TagGroup
                aria-label="Selected"
                onRemove={isDisabled ? undefined : remove}
                className="max-w-full"
              >
                <TagList items={tags} className="flex flex-wrap gap-1">
                  {(tag) => (
                    <Tag
                      id={tag.value}
                      textValue={tag.label}
                      className={cn(
                        'flex h-6 max-w-full cursor-default items-center gap-0.5 rounded border border-border bg-surface ps-2 pe-0.5 text-sm text-fg outline-hidden',
                        // outline-solid is required: outline-hidden above sets --tw-outline-style:none,
                        // which outline-2 would otherwise inherit (same trap as Button).
                        'data-focus-visible:outline-2 data-focus-visible:outline-offset-1 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
                      )}
                    >
                      {({ allowsRemoving }) => (
                        <>
                          <span className="truncate">{tag.label}</span>
                          {allowsRemoving && (
                            // slot="remove": React Aria names it ("Remove Germany") and wires the click.
                            <Button
                              slot="remove"
                              className="rounded p-0.5 text-fg-muted outline-hidden hover:bg-border hover:text-fg"
                            >
                              <XIcon className="size-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </Tag>
                  )}
                </TagList>
              </TagGroup>
            </ComboBoxValue>
          )}
          <Input
            ref={inputRef}
            id={id ?? field?.controlId}
            placeholder={tags.length === 0 ? placeholder : undefined}
            onKeyDown={onInputKeyDown}
            className={cn(
              row,
              'min-w-20 flex-1 bg-transparent px-1 outline-hidden placeholder:text-fg-muted',
            )}
          />
        </div>
        {loading && options.length > 0 && (
          <span className={cn(row, 'flex shrink-0 items-center')}>
            <SpinnerIcon className="size-4 animate-spin text-fg-muted" />
          </span>
        )}
        <Button
          className={cn(
            row,
            'flex shrink-0 items-center px-2 text-fg-muted hover:text-fg',
          )}
        >
          <ChevronIcon className="size-4" />
        </Button>
      </Group>
      <ComboboxPopover loading={loading} emptyMessage={emptyMessage} />
    </AriaComboBox>
  );
}
