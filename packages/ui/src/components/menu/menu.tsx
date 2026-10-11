import type { ReactNode, SVGProps } from 'react';
import {
  Header,
  Keyboard,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger,
  Popover,
  Separator,
  // React Aria marks SubmenuTrigger "alpha". Same rule as UNSTABLE_ APIs (recipe rule
  // 22): only this file imports it, it doesn't appear in our public types, and the
  // package is patch-pinned, so an upgrade that changes it is a deliberate PR.
  SubmenuTrigger,
  Text,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import {
  TriggerButton,
  type TriggerButtonProps,
  type TriggerPlacement,
} from '../button/trigger-button';

export type MenuProps = TriggerButtonProps & {
  /** Where the menu opens, relative to the trigger. Flips if there's no room. @default 'bottom start' */
  placement?: TriggerPlacement;
  /** `MenuItem`, `MenuSection` and `MenuSeparator` elements. */
  children: ReactNode;
};

/**
 * A button that opens a list of actions ("Actions ▾", "⋯" on a row).
 *
 * Keyboard: Enter, Space or ↓ opens it on the first item (↑ on the last); arrows move,
 * typing a letter jumps to an item, Enter runs it. Escape closes and puts focus back on
 * the button. Built on React Aria `MenuTrigger` + `Menu` (ARIA "menu button" pattern).
 *
 * A menu is for **actions**. To pick a value for a form, use Select or Combobox.
 *
 * @example
 * <Menu label="Actions" intent="secondary">
 *   <MenuItem onAction={edit}>Edit</MenuItem>
 *   <MenuItem onAction={duplicate} shortcut="Ctrl+D">Duplicate</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem intent="danger" onAction={remove}>Delete</MenuItem>
 * </Menu>
 */
export function Menu({
  placement = 'bottom start',
  children,
  ...trigger
}: MenuProps) {
  return (
    <MenuTrigger>
      <TriggerButton {...trigger} />
      <Popover
        placement={placement}
        offset={4}
        className="min-w-44 rounded-md border border-border bg-bg p-1 text-fg shadow-lg outline-hidden"
      >
        <AriaMenu className="max-h-[inherit] overflow-auto outline-hidden">
          {children}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}

export type MenuItemProps = {
  /** Visible text. Also what typing a letter matches. */
  children: string;
  /** Unique within its section. Needed only in a section with `selectionMode`. */
  id?: string;
  /** Runs when the item is chosen (click, Enter or Space). The menu then closes. */
  onAction?: () => void;
  /**
   * Makes the item a link (`<a>`): choosing it navigates. Works with a client-side
   * router through React Aria's `RouterProvider`, like our other links.
   */
  href?: string;
  /** `danger` for destructive actions (Delete). Red text, not a red background. */
  intent?: 'default' | 'danger';
  /** Second line in smaller text ("Only the selected rows"). */
  description?: string;
  /** A keyboard shortcut to show on the right ("Ctrl+D"). Display only: it doesn't bind the key. */
  shortcut?: string;
  disabled?: boolean;
};

/** One action in a Menu. Must be a direct child of `Menu` or `MenuSection`. */
export function MenuItem({
  children,
  id,
  onAction,
  href,
  intent = 'default',
  description,
  shortcut,
  disabled,
}: MenuItemProps) {
  return (
    <AriaMenuItem
      id={id ?? children}
      textValue={children}
      onAction={onAction}
      href={href}
      isDisabled={disabled}
      className={cn(
        'flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-hidden',
        'data-focused:bg-surface',
        intent === 'danger' && 'text-fg-danger',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',
      )}
    >
      {({ selectionMode, isSelected }) => (
        <>
          {/* Selectable sections: a check (multiple) or a dot (single) in a fixed column. */}
          {selectionMode !== 'none' && (
            <span className="flex size-4 shrink-0 items-center justify-center">
              {isSelected &&
                (selectionMode === 'multiple' ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                ))}
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <Text slot="label" className="truncate">
              {children}
            </Text>
            {description && (
              <Text slot="description" className="text-xs text-fg-muted">
                {description}
              </Text>
            )}
          </span>
          {shortcut && (
            <Keyboard className="ms-4 font-mono text-xs text-fg-muted">
              {shortcut}
            </Keyboard>
          )}
        </>
      )}
    </AriaMenuItem>
  );
}

export type MenuSectionProps = {
  /** Small heading above the group. Also names the group for screen readers. */
  title?: string;
  /**
   * Make the items toggles instead of actions:
   * - `multiple`: checkboxes (`menuitemcheckbox`), e.g. "Show columns".
   * - `single`: radio buttons (`menuitemradio`), e.g. "Density".
   * Items then need an `id`. Toggling doesn't close the menu, so you can change several.
   */
  selectionMode?: 'single' | 'multiple';
  /** The `id`s of the checked items (controlled). */
  selectedKeys?: readonly string[];
  /** Called with the new list of checked `id`s. */
  onSelectionChange?: (keys: string[]) => void;
  children: ReactNode;
};

/** A group of items with an optional title, and optionally checkable. */
export function MenuSection({
  title,
  selectionMode,
  selectedKeys,
  onSelectionChange,
  children,
}: MenuSectionProps) {
  return (
    <AriaMenuSection
      selectionMode={selectionMode}
      selectedKeys={selectedKeys}
      // React Aria gives a Set of keys (or 'all'); our API speaks plain string arrays.
      onSelectionChange={(keys) =>
        onSelectionChange?.(
          keys === 'all'
            ? [] // never happens: we don't offer "select all"
            : [...keys].map((k: Key) => String(k)),
        )
      }
      // Toggling a checkbox keeps the menu open, like a settings panel.
      shouldCloseOnSelect={selectionMode ? false : undefined}
      className="[&:not(:first-child)]:mt-1"
    >
      {title && (
        <Header className="px-2 pt-1.5 pb-1 text-xs font-medium text-fg-muted">
          {title}
        </Header>
      )}
      {children}
    </AriaMenuSection>
  );
}

export type MenuSubmenuProps = {
  /** The item that opens the submenu ("Export as"). */
  label: string;
  /** `MenuItem`s (and sections or separators) inside the submenu. */
  children: ReactNode;
  disabled?: boolean;
};

/**
 * An item that opens a second menu beside it ("Export as ▸ CSV / Excel / PDF").
 * Must be a direct child of `Menu` or `MenuSection`.
 *
 * Keyboard: → (or Enter) opens it on its first item, ← closes it and goes back to the
 * parent item (mirrored in right-to-left languages). Hovering opens it after a short
 * delay. Choosing an item closes the whole menu.
 *
 * Keep it to one level: menus inside submenus inside menus are hard to use with a
 * mouse and slow with a keyboard.
 *
 * @example
 * <MenuSubmenu label="Export as">
 *   <MenuItem onAction={exportCsv}>CSV</MenuItem>
 *   <MenuItem onAction={exportPdf}>PDF</MenuItem>
 * </MenuSubmenu>
 */
export function MenuSubmenu({ label, children, disabled }: MenuSubmenuProps) {
  return (
    <SubmenuTrigger>
      {/* First child: the item that opens it. React Aria adds aria-haspopup and
          aria-expanded, and data-open while the submenu is showing. */}
      <AriaMenuItem
        id={label}
        textValue={label}
        isDisabled={disabled}
        className={cn(
          'flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-sm outline-hidden',
          'data-focused:bg-surface data-open:bg-surface',
          'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronIcon className="size-4 text-fg-muted rtl:-scale-x-100" />
      </AriaMenuItem>
      {/* Second child: the submenu. Placement (beside the item, flipping if there's
          no room) comes from React Aria. */}
      <Popover
        offset={-4}
        className="min-w-40 rounded-md border border-border bg-bg p-1 text-fg shadow-lg outline-hidden"
      >
        <AriaMenu className="max-h-[inherit] overflow-auto outline-hidden">
          {children}
        </AriaMenu>
      </Popover>
    </SubmenuTrigger>
  );
}

/** A thin line between groups of items. */
export function MenuSeparator() {
  return <Separator className="mx-1 my-1 border-t border-border" />;
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
      <path d="m6 3.5 4.5 4.5L6 12.5" />
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
