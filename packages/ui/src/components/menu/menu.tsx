import type { VariantProps } from 'class-variance-authority';
import type { ReactNode, SVGProps } from 'react';
import {
  Button as AriaButton,
  Header,
  Keyboard,
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger,
  Popover,
  Separator,
  Text,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { buttonVariants } from '../button/button';

type Placement =
  | 'bottom start'
  | 'bottom end'
  | 'top start'
  | 'top end'
  | 'start'
  | 'end';

export type MenuProps = Pick<
  VariantProps<typeof buttonVariants>,
  'intent' | 'size'
> & {
  /** What the trigger button shows: text ("Actions") or an icon. */
  label: ReactNode;
  /**
   * Accessible name for the trigger. Required when `label` is only an icon
   * (`aria-label="Row actions"`); otherwise the label's text is the name.
   */
  'aria-label'?: string;
  /** Show a ▾ after the label. Turn off for icon-only triggers. @default true */
  chevron?: boolean;
  /** Where the menu opens, relative to the trigger. Flips if there's no room. @default 'bottom start' */
  placement?: Placement;
  /** The trigger can't be used. */
  disabled?: boolean;
  /** `MenuItem`, `MenuSection` and `MenuSeparator` elements. */
  children: ReactNode;
  /** Classes for the trigger button. */
  className?: string;
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
  label,
  'aria-label': ariaLabel,
  chevron = true,
  placement = 'bottom start',
  disabled,
  intent = 'secondary',
  size,
  children,
  className,
}: MenuProps) {
  return (
    <MenuTrigger>
      {/* React Aria's Button, not ours: MenuTrigger only wires its own (aria-expanded,
          ↓ to open). Same classes as Button, so it looks identical. */}
      <AriaButton
        aria-label={ariaLabel}
        isDisabled={disabled}
        className={cn(buttonVariants({ intent, size }), className)}
      >
        {label}
        {chevron && <ChevronIcon className="size-4 opacity-70" />}
      </AriaButton>
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
