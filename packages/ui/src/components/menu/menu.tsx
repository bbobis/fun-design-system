import {
  createContext,
  useContext,
  type ReactNode,
  type SVGProps,
} from 'react';
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
import { popoverMotion } from '../../utils/motion';

/** Row density. `sm` for dense screens (data-grid row actions, toolbars). */
export type MenuSize = 'sm' | 'md';

/*
 * Menu sets the size once; every item, header, submenu and separator inside reads it
 * from context (the same idea as RadioGroup's size). The default ('md') is what an
 * item gets with no Menu around it, e.g. inside CommandPalette.
 */
const MenuSizeContext = createContext<MenuSize>('md');

const sizes = {
  md: {
    panel: 'min-w-44',
    item: 'gap-2 px-2 py-1.5 text-sm',
    icon: '*:size-4',
    header: 'px-2 pt-1.5 pb-1 text-xs',
  },
  sm: {
    panel: 'min-w-36',
    item: 'gap-1.5 px-1.5 py-1 text-xs',
    icon: '*:size-3.5',
    header: 'px-1.5 pt-1 pb-0.5 text-[0.6875rem]',
  },
} as const;

/** Classes shared by MenuItem and the item that opens a submenu. */
const itemClass = (size: MenuSize, intent: 'default' | 'danger' = 'default') =>
  cn(
    'flex cursor-default items-center rounded outline-hidden',
    sizes[size].item,
    'data-focused:bg-surface',
    // Danger: red text, and a soft red row when focused (not gray), so it's clear
    // *before* Enter that this one destroys something.
    intent === 'danger' &&
      'text-fg-danger data-focused:bg-danger-soft data-focused:text-on-danger-soft',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  );

/**
 * The leading icon. aria-hidden: the label already says what the item does, so a
 * screen reader reads "Delete", not "trash, Delete". Muted, except on danger items,
 * where it takes the red text color.
 */
function ItemIcon({
  icon,
  size,
  danger,
}: {
  icon: ReactNode;
  size: MenuSize;
  danger?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      data-menu-icon=""
      className={cn(
        'flex shrink-0 items-center justify-center',
        sizes[size].icon,
        danger ? 'text-current' : 'text-fg-muted',
      )}
    >
      {icon}
    </span>
  );
}

export type MenuProps = TriggerButtonProps & {
  /** Where the menu opens, relative to the trigger. Flips if there's no room. @default 'bottom start' */
  placement?: TriggerPlacement;
  /**
   * Row density for every item inside: `md` for most menus, `sm` for dense screens
   * (row actions in a data grid). Not the trigger's size: that's `size`.
   * @default 'md'
   */
  menuSize?: MenuSize;
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
  menuSize = 'md',
  children,
  ...trigger
}: MenuProps) {
  return (
    <MenuTrigger>
      <TriggerButton {...trigger} />
      <Popover
        placement={placement}
        offset={4}
        className={cn(
          'rounded-md border border-border bg-bg p-1 text-fg shadow-lg outline-hidden',
          sizes[menuSize].panel,
          popoverMotion,
        )}
      >
        <MenuSizeContext.Provider value={menuSize}>
          <AriaMenu className="max-h-[inherit] overflow-auto outline-hidden">
            {children}
          </AriaMenu>
        </MenuSizeContext.Provider>
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
   * router through our `RouterProvider`, like our other links.
   */
  href?: string;
  /**
   * `danger` for destructive actions (Delete): red text, and a soft red row when
   * focused.
   */
  intent?: 'default' | 'danger';
  /**
   * A small icon before the text (an SVG; sized for you). Decorative: hidden from
   * screen readers, so the text must say it all. If one item in a group has an icon,
   * give them all one, or the text won't line up.
   */
  icon?: ReactNode;
  /** Second line in smaller text ("Only the selected rows"). */
  description?: string;
  /** A keyboard shortcut to show on the right ("Ctrl+D"). Display only: it doesn't bind the key. */
  shortcut?: string;
  /**
   * Other words that should find this item when typed in a CommandPalette
   * (`['bills']` for "Go to invoices"). Not shown.
   */
  keywords?: readonly string[];
  disabled?: boolean;
};

/**
 * One action in a Menu or CommandPalette. Must be a direct child of `Menu`,
 * `CommandPalette` or `MenuSection`.
 */
export function MenuItem({
  children,
  id,
  onAction,
  href,
  intent = 'default',
  description,
  shortcut,
  keywords,
  disabled,
  icon,
}: MenuItemProps) {
  const size = useContext(MenuSizeContext);
  return (
    <AriaMenuItem
      id={id ?? children}
      // What filtering (CommandPalette) and typeahead (typing a letter) match on. The
      // label comes first, so typeahead still matches the start of the visible text.
      textValue={
        keywords?.length ? `${children} ${keywords.join(' ')}` : children
      }
      onAction={onAction}
      href={href}
      isDisabled={disabled}
      className={itemClass(size, intent)}
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
          {icon && (
            <ItemIcon icon={icon} size={size} danger={intent === 'danger'} />
          )}
          <span className="flex min-w-0 flex-1 flex-col">
            <Text slot="label" className="truncate">
              {children}
            </Text>
            {description && (
              <Text
                slot="description"
                className={cn(
                  'text-fg-muted',
                  size === 'sm' ? 'text-[0.6875rem]' : 'text-xs',
                )}
              >
                {description}
              </Text>
            )}
          </span>
          {shortcut && (
            <Keyboard
              className={cn(
                'ms-4 font-mono text-fg-muted',
                size === 'sm' ? 'text-[0.6875rem]' : 'text-xs',
              )}
            >
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
  const size = useContext(MenuSizeContext);
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
        <Header className={cn('font-medium text-fg-muted', sizes[size].header)}>
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
  /** A small decorative icon before the label, like MenuItem's. */
  icon?: ReactNode;
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
export function MenuSubmenu({
  label,
  children,
  disabled,
  icon,
}: MenuSubmenuProps) {
  const size = useContext(MenuSizeContext);
  return (
    <SubmenuTrigger>
      {/* First child: the item that opens it. React Aria adds aria-haspopup and
          aria-expanded, and data-open while the submenu is showing. */}
      <AriaMenuItem
        id={label}
        textValue={label}
        isDisabled={disabled}
        className={cn(itemClass(size), 'data-open:bg-surface')}
      >
        {icon && <ItemIcon icon={icon} size={size} />}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <ChevronIcon className="size-4 text-fg-muted rtl:-scale-x-100" />
      </AriaMenuItem>
      {/* Second child: the submenu. Placement (beside the item, flipping if there's
          no room) comes from React Aria. */}
      <Popover
        offset={-4}
        className={cn(
          'rounded-md border border-border bg-bg p-1 text-fg shadow-lg outline-hidden',
          size === 'sm' ? 'min-w-32' : 'min-w-40',
          popoverMotion,
        )}
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
