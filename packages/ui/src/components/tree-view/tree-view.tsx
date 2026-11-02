import type { ReactNode, SVGProps } from 'react';
import {
  Button as AriaButton,
  Checkbox as AriaCheckbox,
  Collection,
  Tree as AriaTree,
  TreeItem as AriaTreeItem,
  TreeItemContent,
  type Key,
  type Selection,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { CheckboxBox } from '../checkbox-group/checkbox-group';

/** One node in the tree. Give it `children` (even `[]`) to make it a folder. */
export type TreeNode = {
  /** Unique across the whole tree; used in selection, expansion and `onAction`. */
  id: string;
  /** What the row says. Also what type-ahead matches. */
  label: string;
  /** An icon before the label (decorative: give it `aria-hidden`). */
  icon?: ReactNode;
  /** Extra text after the label, muted ("3 files", a count). */
  meta?: ReactNode;
  /** Child nodes. */
  children?: TreeNode[];
  /** Can't be selected or actioned (it still shows and can expand). */
  disabled?: boolean;
};

export type TreeViewProps = {
  /** Names the tree for screen readers ("Files", "Org chart"). Required. */
  'aria-label': string;
  /** The tree's data. Rendered recursively. */
  nodes: TreeNode[];
  /**
   * `none`: rows only act (`onAction`). `single`: one row selected (highlight + ✓).
   * `multiple`: a checkbox on every row.
   * @default 'none'
   */
  selectionMode?: 'none' | 'single' | 'multiple';
  /** Selected ids (controlled). */
  selected?: string[];
  /** Starting selection (uncontrolled). */
  defaultSelected?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Expanded folder ids (controlled). */
  expanded?: string[];
  /** Folders open at first (uncontrolled). */
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /**
   * "Open" a row. With `selectionMode="none"`: Enter or a click. With `single`: Enter
   * or a double-click (a click selects, like a file browser). With `multiple`: Enter
   * when nothing is selected; otherwise Enter and clicks toggle the checkbox.
   */
  onAction?: (id: string) => void;
  /** Shown when `nodes` is empty. @default 'Nothing here yet.' */
  emptyState?: ReactNode;
  /** Row density: `sm` for dense sidebars (smaller text, rows and indent). @default 'md' */
  size?: 'sm' | 'md';
  /**
   * Thin vertical lines that show which folder a row is in. Visual only: screen
   * readers get the depth from `aria-level`, which React Aria sets on every row.
   * @default false
   */
  guides?: boolean;
  className?: string;
};

/**
 * Per size. The indent and the guide position are CSS variables on the tree, so each
 * row's padding and guide lines are one calc each (React Aria sets
 * --tree-item-level on the row: 1 at the top).
 * --tree-guide-x is the middle of the arrow column, where a parent's line runs down.
 */
const treeSizes = {
  md: {
    tree: '[--tree-indent:1.25rem] [--tree-guide-x:0.875rem] text-sm',
    row: 'gap-1.5 py-1.5',
    chevron: 'size-5',
    chevronIcon: 'size-3.5',
  },
  sm: {
    tree: '[--tree-indent:1rem] [--tree-guide-x:0.75rem] text-xs',
    row: 'gap-1 py-1',
    chevron: 'size-4',
    chevronIcon: 'size-3',
  },
} as const;

const toIds = (keys: Selection | Set<Key>): string[] =>
  keys === 'all' ? [] : [...keys].map(String);

/**
 * A hierarchy people can expand, collapse and move through with the keyboard: folders
 * and files, an org chart, categories. Built on React Aria `Tree` (`role="treegrid"`).
 *
 * Keyboard: ↑/↓ move between visible rows, → opens a folder (then moves into it),
 * ← closes it (or moves up to the parent), Home/End jump, typing a letter jumps to the
 * next matching row. Enter runs `onAction`; Space selects.
 *
 * For site navigation with links, use SideNav; for a few collapsible sections of
 * content, Accordion.
 *
 * @example
 * <TreeView aria-label="Files" nodes={nodes} defaultExpanded={['billing']}
 *   selectionMode="single" onSelectionChange={setSelected} />
 */
export function TreeView({
  'aria-label': ariaLabel,
  nodes,
  selectionMode = 'none',
  selected,
  defaultSelected,
  onSelectionChange,
  expanded,
  defaultExpanded,
  onExpandedChange,
  onAction,
  emptyState = 'Nothing here yet.',
  size = 'md',
  guides = false,
  className,
}: TreeViewProps) {
  // One function renders a node, and calls itself (through Collection) for its children.
  const renderNode = (node: TreeNode) => (
    <TreeRow
      key={node.id}
      node={node}
      selectionMode={selectionMode}
      size={size}
      guides={guides}
    >
      {node.children && (
        <Collection items={node.children}>{renderNode}</Collection>
      )}
    </TreeRow>
  );

  return (
    <AriaTree
      aria-label={ariaLabel}
      items={nodes}
      selectionMode={selectionMode}
      // single: like a file browser. Click or arrows select, Enter or double-click act.
      // multiple: checkboxes toggle, so selecting more never clears the rest.
      selectionBehavior={selectionMode === 'multiple' ? 'toggle' : 'replace'}
      selectedKeys={selected}
      defaultSelectedKeys={defaultSelected}
      onSelectionChange={
        onSelectionChange && ((keys) => onSelectionChange(toIds(keys)))
      }
      expandedKeys={expanded}
      defaultExpandedKeys={defaultExpanded}
      onExpandedChange={
        onExpandedChange && ((keys) => onExpandedChange(toIds(keys)))
      }
      onAction={onAction && ((key) => onAction(String(key)))}
      renderEmptyState={() => (
        <p className="px-3 py-6 text-center text-sm text-fg-muted">
          {emptyState}
        </p>
      )}
      className={cn(
        'flex flex-col overflow-auto rounded-md text-fg outline-hidden',
        treeSizes[size].tree,
        // A 1px gap between rows, except with guides: it would break the lines.
        !guides && 'gap-px',
        // The tree itself gets focus only when it's empty.
        'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        className,
      )}
    >
      {renderNode}
    </AriaTree>
  );
}

function TreeRow({
  node,
  selectionMode,
  size,
  guides,
  children,
}: {
  node: TreeNode;
  selectionMode: TreeViewProps['selectionMode'];
  size: 'sm' | 'md';
  guides: boolean;
  children?: ReactNode;
}) {
  const s = treeSizes[size];
  return (
    <AriaTreeItem
      id={node.id}
      textValue={node.label}
      isDisabled={node.disabled}
      className={cn(
        'group relative flex cursor-default items-center rounded-md pe-2 outline-hidden select-none',
        s.row,
        // Indent by depth: React Aria sets --tree-item-level (1 at the top).
        'ps-[calc((var(--tree-item-level)-1)*var(--tree-indent)+0.25rem)]',
        // Guides: one 1px line per ancestor, from a single pseudo-element. It's as
        // wide as the indent, and a gradient tile (1px line, then transparent)
        // repeats every --tree-indent: level 3 gets two lines, level 1 none.
        guides && [
          'before:pointer-events-none before:absolute before:inset-y-0 before:start-(--tree-guide-x)',
          'before:w-[calc((var(--tree-item-level)-1)*var(--tree-indent))]',
          'before:bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px)] before:bg-size-[var(--tree-indent)_100%] before:bg-repeat-x',
          'rtl:before:bg-[linear-gradient(to_left,var(--color-border)_1px,transparent_1px)] rtl:before:bg-right',
        ],
        'hover:bg-surface',
        'data-selected:bg-surface data-selected:font-medium',
        // Inside the row, so a scrolling tree can't clip it (recipe rule 26).
        // outline-solid is needed: outline-hidden above sets the style to none.
        'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        'data-disabled:cursor-not-allowed data-disabled:text-fg-muted',
      )}
    >
      <TreeItemContent>
        {({ hasChildItems, isSelected }) => (
          <>
            {hasChildItems ? (
              // slot="chevron": React Aria makes it toggle the folder. It's not a Tab
              // stop; → and ← do the same from the keyboard.
              <AriaButton
                slot="chevron"
                className={cn(
                  'flex shrink-0 items-center justify-center rounded text-fg-muted outline-hidden hover:text-fg',
                  s.chevron,
                )}
              >
                <ChevronIcon
                  className={cn(
                    'transition-transform group-data-expanded:rotate-90 rtl:-scale-x-100 motion-reduce:transition-none',
                    s.chevronIcon,
                  )}
                />
              </AriaButton>
            ) : (
              <span className={cn('shrink-0', s.chevron)} aria-hidden="true" />
            )}
            {selectionMode === 'multiple' && (
              // slot="selection": React Aria wires this checkbox to the row's selection.
              <AriaCheckbox slot="selection" className="flex">
                <CheckboxBox />
              </AriaCheckbox>
            )}
            {node.icon && (
              <span
                className={cn(
                  'flex shrink-0 items-center justify-center text-fg-muted',
                  size === 'sm' ? 'size-3.5 *:size-3.5' : 'size-4',
                )}
              >
                {node.icon}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate">{node.label}</span>
            {node.meta && (
              <span
                className={cn(
                  'shrink-0 font-normal text-fg-muted',
                  size === 'sm' ? 'text-[0.6875rem]' : 'text-xs',
                )}
              >
                {node.meta}
              </span>
            )}
            {selectionMode === 'single' && isSelected && (
              // Selected isn't shown by color alone (WCAG 1.4.1).
              <CheckIcon
                className={cn(
                  'shrink-0',
                  size === 'sm' ? 'size-3.5' : 'size-4',
                )}
              />
            )}
          </>
        )}
      </TreeItemContent>
      {children}
    </AriaTreeItem>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m6 4 4 4-4 4" />
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
