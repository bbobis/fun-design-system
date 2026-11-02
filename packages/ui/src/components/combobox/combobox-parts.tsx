import { useContext, useEffect, type SVGProps } from 'react';
import {
  ComboBoxStateContext,
  ListBox,
  ListBoxItem,
  ListLayout,
  Popover,
  Virtualizer,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import type { SelectOption } from '../select';
import {
  listRowClass,
  listRowHeight,
  listRowText,
  OptionContent,
  optionRowClass,
  type ListSize,
} from '../select/option-content';

import { popoverMotion } from '../../utils/motion';

// Stepper and TagGroup import CheckIcon from here; it now lives with the option parts.
export { CheckIcon } from '../select/option-content';

/**
 * Put inside a React Aria `ComboBox` to highlight the first enabled option whenever
 * the list is open and there's typed text, so Enter (and Tab) pick it: the ARIA "list
 * autocomplete with automatic selection" pattern. Renders nothing. Only once the user
 * has typed: while the text is still the chosen option's label, nothing changes.
 *
 * React Aria clears the highlight every time the text changes, in an effect of the
 * ComboBox itself. A parent's effects run *after* its children's, so setting it in our
 * own effect would be undone at once. A microtask runs after all of this render's
 * effects, so the highlight sticks.
 */
export function AutoHighlightFirst() {
  const state = useContext(ComboBoxStateContext);
  const isOpen = state?.isOpen ?? false;
  const text = state?.inputValue ?? '';
  const collection = state?.collection;
  useEffect(() => {
    if (!state || !isOpen || text === '' || !collection) return;
    // Text still shows the chosen option (opened, nothing typed yet): leave it, so
    // Enter keeps the current value instead of jumping to the first option.
    if (state.selectedItem?.textValue === text) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || state.selectionManager.focusedKey != null) return;
      for (const node of collection) {
        if (node.type === 'item' && !state.disabledKeys.has(node.key)) {
          state.selectionManager.setFocusedKey(node.key);
          return;
        }
      }
    });
    return () => {
      cancelled = true;
    };
    // `state` is a new object every render; these are the parts that matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, text, collection]);
  return null;
}

/**
 * The dropdown shared by Combobox and MultiCombobox: a popover as wide as the field,
 * holding a virtualized list. It reads the options and selection from the surrounding
 * React Aria `ComboBox` (through context), so it takes no items itself.
 */
export function ComboboxPopover({
  loading,
  emptyMessage,
  size = 'md',
  withDescriptions = false,
}: {
  loading: boolean;
  emptyMessage: string;
  /** The field's size: the list matches it. The DataGrid editor leaves it at md. */
  size?: ListSize;
  /** Any option has a description: rows use the taller heights. */
  withDescriptions?: boolean;
}) {
  const rows = withDescriptions ? 'described' : 'plain';
  return (
    <Popover
      offset={4}
      className={cn(
        'w-(--trigger-width) min-w-40 rounded-md border border-border bg-bg shadow-lg',
        popoverMotion,
      )}
    >
      {/*
        React Aria's own virtualizer: only the visible rows are in the DOM. It places
        rows by maths, not by measuring, so each row must be exactly listRowHeight tall
        (the matching h-* class below). Fixed heights let it place 10,000 rows cheaply.
      */}
      <Virtualizer
        layout={ListLayout}
        layoutOptions={{ rowHeight: listRowHeight[rows][size], padding: 4 }}
      >
        <ListBox<SelectOption>
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
                'mx-1',
                optionRowClass,
                listRowClass[rows][size],
                listRowText[size],
              )}
            >
              {({ isSelected }) => (
                <OptionContent option={option} isSelected={isSelected} />
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Virtualizer>
    </Popover>
  );
}

export function ChevronIcon(props: SVGProps<SVGSVGElement>) {
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

export function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
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

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      {...props}
    >
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </svg>
  );
}
