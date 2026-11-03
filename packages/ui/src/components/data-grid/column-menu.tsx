import type { SVGProps } from 'react';
import { cn } from '../../utils/cn';
import { Menu, MenuItem, MenuSection, MenuSeparator } from '../menu';
import type { DataGridPinSide } from './column-state';

export type HeaderMenuProps = {
  /** The column's name ("Status"); names the button "Status column options". */
  label: string;
  columnId: string;
  /** Show the sort items. */
  sortable: boolean;
  sorted: false | 'asc' | 'desc';
  onSort: (direction: 'asc' | 'desc' | false) => void;
  pinned: DataGridPinSide | 'center';
  onPin: (side: DataGridPinSide | null) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMove: (step: -1 | 1) => void;
  /** False for the last visible column: a grid with no columns can't get them back. */
  canHide: boolean;
  onHide: () => void;
  /** "Resize column": focus the edge handle for arrow-key resizing. */
  onResizeStart: () => void;
  /** "Fit to content". */
  onFit: () => void;
};

/**
 * The ⌄ button on a column header and its menu. One React Aria `Menu`: arrows move,
 * Enter runs, Escape closes and puts focus back on the button.
 *
 * Sections are only for grouping (a heading each); none are checkable, because each
 * item is an action that closes the menu.
 */
export function HeaderMenu({
  label,
  columnId,
  sortable,
  sorted,
  onSort,
  pinned,
  onPin,
  canMoveLeft,
  canMoveRight,
  onMove,
  canHide,
  onHide,
  onResizeStart,
  onFit,
}: HeaderMenuProps) {
  return (
    <span
      // The grid finds the button by this to move focus after "Hide".
      data-column-menu={columnId}
      className={cn(
        'ms-auto flex shrink-0',
        // Shown on hover and while focused or open. Always shown on touch screens,
        // which have no hover (Tailwind's `pointer-coarse:`).
        'opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100',
        'has-[[aria-expanded=true]]:opacity-100',
        // Keep it visible while the column is changed from the default, as a hint.
        (sorted || pinned !== 'center') && 'opacity-100',
      )}
    >
      <Menu
        label={<ChevronIcon className="size-3.5" />}
        aria-label={`${label} column options`}
        chevron={false}
        intent="ghost"
        size="sm"
        menuSize="sm"
        placement="bottom end"
        className="size-6 h-6 rounded px-0 text-fg-muted hover:text-fg"
      >
        {sortable && (
          <MenuSection title="Sort">
            <MenuItem
              id="sort-asc"
              icon={<ArrowIcon className="size-4" />}
              disabled={sorted === 'asc'}
              onAction={() => onSort('asc')}
            >
              Sort ascending
            </MenuItem>
            <MenuItem
              id="sort-desc"
              icon={<ArrowIcon className="size-4 rotate-180" />}
              disabled={sorted === 'desc'}
              onAction={() => onSort('desc')}
            >
              Sort descending
            </MenuItem>
            {sorted && (
              <MenuItem
                id="sort-clear"
                icon={<XIcon className="size-4" />}
                onAction={() => onSort(false)}
              >
                Clear sort
              </MenuItem>
            )}
          </MenuSection>
        )}
        {sortable && <MenuSeparator />}
        <MenuSection title="Pin">
          {pinned !== 'start' && (
            <MenuItem
              id="pin-start"
              icon={<PinIcon className="size-4" />}
              onAction={() => onPin('start')}
            >
              Pin to start
            </MenuItem>
          )}
          {pinned !== 'end' && (
            <MenuItem
              id="pin-end"
              icon={<PinIcon className="size-4 -scale-x-100" />}
              onAction={() => onPin('end')}
            >
              Pin to end
            </MenuItem>
          )}
          {pinned !== 'center' && (
            <MenuItem
              id="unpin"
              icon={<XIcon className="size-4" />}
              onAction={() => onPin(null)}
            >
              Unpin
            </MenuItem>
          )}
        </MenuSection>
        <MenuSeparator />
        <MenuSection title="Column">
          <MenuItem
            id="resize"
            icon={<ResizeIcon className="size-4" />}
            onAction={onResizeStart}
          >
            Resize column
          </MenuItem>
          <MenuItem
            id="fit"
            icon={<FitIcon className="size-4" />}
            onAction={onFit}
          >
            Fit to content
          </MenuItem>
          <MenuItem
            id="move-left"
            icon={<ArrowIcon className="size-4 -rotate-90" />}
            disabled={!canMoveLeft}
            onAction={() => onMove(-1)}
          >
            Move left
          </MenuItem>
          <MenuItem
            id="move-right"
            icon={<ArrowIcon className="size-4 rotate-90" />}
            disabled={!canMoveRight}
            onAction={() => onMove(1)}
          >
            Move right
          </MenuItem>
          <MenuItem
            id="hide"
            icon={<EyeOffIcon className="size-4" />}
            disabled={!canHide}
            onAction={onHide}
          >
            Hide column
          </MenuItem>
        </MenuSection>
      </Menu>
    </span>
  );
}

export type ColumnsMenuProps = {
  /** Every hideable column, in display order. */
  columns: readonly { id: string; label: string }[];
  visibleIds: readonly string[];
  onVisibleChange: (ids: string[]) => void;
  onReset: () => void;
  /** Turned off while editing (the layout is frozen then). */
  disabled?: boolean;
};

/**
 * The toolbar's "Columns ▾": a checklist to show and hide columns (it stays open while
 * you tick), and "Reset columns" to go back to the original layout.
 */
export function ColumnsMenu({
  columns,
  visibleIds,
  onVisibleChange,
  onReset,
  disabled,
}: ColumnsMenuProps) {
  return (
    <Menu
      label="Columns"
      size="sm"
      intent="secondary"
      menuSize="sm"
      placement="bottom end"
      disabled={disabled}
    >
      <MenuSection
        title="Show columns"
        selectionMode="multiple"
        selectedKeys={visibleIds}
        // Unticking the last one would leave an empty grid: ignore it.
        onSelectionChange={(ids) => {
          if (ids.length > 0) onVisibleChange(ids);
        }}
      >
        {columns.map((c) => (
          <MenuItem key={c.id} id={c.id}>
            {c.label}
          </MenuItem>
        ))}
      </MenuSection>
      <MenuSeparator />
      <MenuItem id="reset" onAction={onReset}>
        Reset columns
      </MenuItem>
    </Menu>
  );
}

function Svg(props: SVGProps<SVGSVGElement>) {
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
    />
  );
}
const ChevronIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m4 6 4 4 4-4" />
  </Svg>
);
/** Points up; rotate it for the other directions. */
const ArrowIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M8 13V3m-4 4 4-4 4 4" />
  </Svg>
);
const PinIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M3 2.5v11" />
    <path d="M6 5h7v6H6z" />
  </Svg>
);
const EyeOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M2 8s2.2-4 6-4 6 4 6 4-2.2 4-6 4-6-4-6-4z" />
    <circle cx="8" cy="8" r="1.75" />
    <path d="m2.5 2.5 11 11" />
  </Svg>
);
const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m4.5 4.5 7 7m0-7-7 7" />
  </Svg>
);
const ResizeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M8 2.5v11M2.5 8h3m-1.5-2-2 2 2 2m9.5-2h-3m1.5-2 2 2-2 2" />
  </Svg>
);
const FitIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M2.5 3v10m11-10v10M5 8h6M6.5 6.5 5 8l1.5 1.5m3-3L11 8 9.5 9.5" />
  </Svg>
);
