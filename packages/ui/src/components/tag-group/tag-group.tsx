import type { ReactNode } from 'react';
import {
  Label,
  Tag,
  TagGroup as AriaTagGroup,
  TagList,
  Text,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { CheckIcon } from '../combobox/combobox-parts';
import { TagRemoveButton, tagVariants } from './tag-parts';

export type TagItem = {
  /** Stable and unique within the group. */
  id: string;
  /** The chip's text; also its accessible name ("Remove Status: Open"). */
  label: string;
  /** Can't be removed or selected. */
  disabled?: boolean;
};

export type TagGroupProps<T extends TagItem> = {
  /** What the chips are ("Active filters"). Names the group. Required. */
  label: ReactNode;
  /** Keep the label for screen readers only (when the page already says it). */
  hideLabel?: boolean;
  /** Help text under the chips. */
  description?: ReactNode;
  /** Error message under the chips. Read out with the group. */
  error?: ReactNode;
  /** The chips, in order. */
  items: readonly T[];
  /**
   * Makes chips removable: each gets a ✕ button, and Delete / Backspace removes the
   * focused (or selected) chips. Called with their ids; remove them from `items`.
   */
  onRemove?: (ids: string[]) => void;
  /**
   * Chips you can toggle (filter choices): 'single' or 'multiple'. Space / Enter or a
   * click toggles. @default 'none'
   */
  selectionMode?: 'none' | 'single' | 'multiple';
  /** The selected chips' ids (controlled). */
  selectedIds?: readonly string[];
  /** Starting selection when uncontrolled. */
  defaultSelectedIds?: readonly string[];
  /** Called with every selected id after a toggle. */
  onSelectionChange?: (ids: string[]) => void;
  /** Shown when there are no chips. @default 'None' */
  emptyText?: ReactNode;
  /** @default 'sm' */
  size?: 'sm' | 'md';
  className?: string;
};

/**
 * A row of chips: active filters you can remove, recipients, labels, or filter choices
 * you can toggle.
 *
 * Keyboard: the chips are one Tab stop. ←/→ move between them (Home/End to the ends),
 * Delete or Backspace removes (with `onRemove`), Space or Enter toggles (with
 * `selectionMode`). Built on React Aria `TagGroup` (a `grid` of `row`s).
 *
 * @example
 * <TagGroup
 *   label="Active filters"
 *   items={filters}
 *   onRemove={(ids) => setFilters((f) => f.filter((x) => !ids.includes(x.id)))}
 * />
 */
export function TagGroup<T extends TagItem>({
  label,
  hideLabel = false,
  description,
  error,
  items,
  onRemove,
  selectionMode = 'none',
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  emptyText = 'None',
  size = 'sm',
  className,
}: TagGroupProps<T>) {
  const ids = (keys: Iterable<Key>) => [...keys].map(String);
  const selectable = selectionMode !== 'none';

  return (
    <AriaTagGroup
      onRemove={onRemove && ((keys) => onRemove(ids(keys)))}
      selectionMode={selectionMode}
      selectedKeys={selectedIds}
      defaultSelectedKeys={defaultSelectedIds}
      onSelectionChange={
        onSelectionChange &&
        ((keys) =>
          // 'all' only comes from Ctrl+A in 'multiple' mode: every enabled chip.
          onSelectionChange(
            keys === 'all'
              ? items.filter((i) => !i.disabled).map((i) => i.id)
              : ids(keys),
          ))
      }
      disabledKeys={items.filter((i) => i.disabled).map((i) => i.id)}
      className={cn('flex flex-col gap-1.5', className)}
    >
      <Label
        className={cn('text-sm font-medium text-fg', hideLabel && 'sr-only')}
      >
        {label}
      </Label>
      <TagList
        items={items}
        className={cn(
          'flex flex-wrap gap-1.5 rounded outline-hidden',
          // Removing the last chip moves focus to the (now empty) list itself, so it
          // needs a visible ring then. React Aria sets data-focus-visible on it.
          'data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        )}
        renderEmptyState={() => (
          <span className="text-sm text-fg-muted">{emptyText}</span>
        )}
      >
        {(item) => (
          <Tag
            id={item.id}
            textValue={item.label}
            className={tagVariants({
              size,
              interactive: selectable,
              removable: Boolean(onRemove),
            })}
          >
            {({ allowsRemoving, isSelected }) => (
              <>
                {/* A ✓ as well as the tint: selection must not be shown by color alone. */}
                {isSelected && (
                  <CheckIcon className="-ms-0.5 me-0.5 size-3.5 shrink-0" />
                )}
                <span className="truncate">{item.label}</span>
                {allowsRemoving && <TagRemoveButton />}
              </>
            )}
          </Tag>
        )}
      </TagList>
      {description && (
        <Text slot="description" className="text-sm text-fg-muted">
          {description}
        </Text>
      )}
      {error && (
        <Text slot="errorMessage" className="text-sm text-fg-danger">
          {error}
        </Text>
      )}
    </AriaTagGroup>
  );
}
