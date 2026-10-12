import type { ReactNode, SVGProps } from 'react';
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export type ReorderableItem = {
  /** Stable and unique: it's how the list tracks the item while it moves. */
  id: string;
  /** What the row says; also what screen readers call it ("Drag Due date"). */
  label: string;
  /** A second, smaller line. Read after the label ("Customer, Company name"). */
  description?: string;
};

export type ReorderableListProps<T extends ReorderableItem> = {
  /** Names the list ("Column order"). Required: there's no visible heading inside. */
  'aria-label': string;
  /** The items, in their current order. */
  items: readonly T[];
  /**
   * Called with the whole list in its new order after a drag (mouse, touch or
   * keyboard). Controlled only: save it and pass it back as `items`.
   */
  onReorder: (items: T[]) => void;
  /** Something after the label, e.g. a Switch to show or hide a column. */
  renderEnd?: (item: T) => ReactNode;
  /** No dragging; the list still shows (e.g. while saving). */
  disabled?: boolean;
  className?: string;
};

/**
 * Moves `keys` to just before or after `targetId`, keeping their relative order.
 * Pure, so it's tested on its own; React Aria only tells us *what* moved *where*.
 */
export function moveItems<T extends { id: string }>(
  items: readonly T[],
  keys: Iterable<Key>,
  targetId: string,
  position: 'before' | 'after',
): T[] {
  const moving = new Set([...keys].map(String));
  if (moving.has(targetId)) return [...items];
  const kept = items.filter((item) => !moving.has(item.id));
  const moved = items.filter((item) => moving.has(item.id));
  const at = kept.findIndex((item) => item.id === targetId);
  if (at === -1) return [...items];
  const index = position === 'before' ? at : at + 1;
  return [...kept.slice(0, index), ...moved, ...kept.slice(index)];
}

/**
 * A list the user can put in order: columns in a table, steps in a workflow, priorities.
 *
 * - Mouse/touch: drag a row by its ⠿ handle; a line shows where it will land.
 * - Keyboard: ↑↓ to a row, → onto its ⠿ handle, Enter to pick it up. ↑↓ then move
 *   through the gaps ("Insert between Status and Issued"); Enter drops, Escape cancels.
 *   React Aria announces each step to screen readers.
 *
 * Built on React Aria `GridList` + `useDragAndDrop`.
 *
 * @example
 * const [columns, setColumns] = useState(initialColumns);
 * <ReorderableList aria-label="Column order" items={columns} onReorder={setColumns} />
 */
export function ReorderableList<T extends ReorderableItem>({
  'aria-label': ariaLabel,
  items,
  onReorder,
  renderEnd,
  disabled = false,
  className,
}: ReorderableListProps<T>) {
  const { dragAndDropHooks } = useDragAndDrop({
    // What a dragged row "carries". Plain text, so dropping it into another app
    // (an email, a text editor) gives something sensible.
    getItems: (keys) =>
      [...keys].map((key) => ({
        'text/plain': items.find((i) => i.id === String(key))?.label ?? '',
      })),
    onReorder: (e) => {
      if (e.target.dropPosition === 'on') return; // reordering only: no nesting
      onReorder(
        moveItems(items, e.keys, String(e.target.key), e.target.dropPosition),
      );
    },
    // The line that shows where the dragged row will land.
    renderDropIndicator: (target) => (
      <DropIndicator
        target={target}
        className="h-0.5 rounded-full outline-hidden data-drop-target:bg-primary"
      />
    ),
    isDisabled: disabled,
  });

  return (
    <GridList
      aria-label={ariaLabel}
      items={items}
      dragAndDropHooks={dragAndDropHooks}
      className={cn(
        'flex flex-col rounded-md border border-border bg-bg p-1 outline-hidden',
        'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        className,
      )}
    >
      {(item) => (
        <GridListItem
          id={item.id}
          // React Aria names the row (aria-label) from textValue alone and drops
          // aria-describedby, so the second line goes into the name: "Customer,
          // Company name". Typing a letter still jumps by the label it starts with.
          textValue={
            item.description ? `${item.label}, ${item.description}` : item.label
          }
          className={cn(
            'flex items-center gap-2 rounded px-2 py-1.5 text-sm text-fg outline-hidden',
            'data-hovered:bg-surface',
            'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
            // The row being dragged stays in place, faded, so you can see where it came from.
            'data-dragging:opacity-40',
          )}
        >
          {/* slot="drag": React Aria makes this the handle, labels it "Drag <label>",
              and lets the keyboard start a drag from it. */}
          <AriaButton
            slot="drag"
            className={cn(
              'flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-fg-muted outline-hidden hover:text-fg',
              'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
              'data-disabled:cursor-not-allowed data-disabled:opacity-50',
            )}
          >
            <GripIcon className="size-4" />
          </AriaButton>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate">{item.label}</span>
            {item.description && (
              <span className="truncate text-xs text-fg-muted">
                {item.description}
              </span>
            )}
          </span>
          {renderEnd?.(item)}
        </GridListItem>
      )}
    </GridList>
  );
}

function GripIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...props}>
      {[3, 8, 13].map((y) =>
        [6, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />),
      )}
    </svg>
  );
}
