import { useContext, useEffect, type ReactNode } from 'react';
import {
  Autocomplete,
  AutocompleteStateContext,
  Dialog as AriaDialog,
  Input,
  Keyboard,
  Menu as AriaMenu,
  Modal,
  ModalOverlay,
  SearchField as AriaSearchField,
  useFilter,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { SearchIcon } from '../data-grid/icons';

export type CommandPaletteProps = {
  /** Open or closed (controlled). Pair with `onOpenChange`. */
  open: boolean;
  /**
   * Called with `false` when it should close (Escape, a click outside, an item was
   * run) and with `true`/`false` when ⌘K / Ctrl+K is pressed. Set your state from it.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * `MenuItem` and `MenuSection` elements, the same ones Menu uses. Give an item
   * `onAction` to run something or `href` to navigate, and `keywords` for other words
   * that should find it.
   */
  children: ReactNode;
  /** Names the palette for screen readers. @default 'Command palette' */
  'aria-label'?: string;
  /** Hint in the search box. Also its accessible name. @default 'Type a command or search…' */
  placeholder?: string;
  /** Shown when nothing matches. Gets what was typed. */
  emptyState?: (search: string) => ReactNode;
  /**
   * ⌘K (Mac) / Ctrl+K (others) anywhere on the page opens and closes it. Turn off if
   * you open it another way or the app already uses that shortcut. Mount only one
   * palette with this on.
   * @default true
   */
  openShortcut?: boolean;
};

/**
 * A search box over a list of actions: press ⌘K / Ctrl+K, type a few letters, ↑/↓ to
 * pick, Enter to run. It closes after running an item and focus goes back to where it
 * was.
 *
 * Built on React Aria `ModalOverlay` + `Dialog` + `Autocomplete` + `Menu`. Autocomplete
 * connects the search box to the menu: typing filters it, and ↑/↓ move a *virtual*
 * focus through it while real focus stays in the box (`aria-activedescendant`), so you
 * can keep typing.
 *
 * The items are our `MenuItem` / `MenuSection`: a command is a menu action in a
 * different container. For a few actions on one thing, use Menu.
 *
 * @example
 * const [open, setOpen] = useState(false);
 * <CommandPalette open={open} onOpenChange={setOpen}>
 *   <MenuSection title="Go to">
 *     <MenuItem href="/invoices" keywords={['bills']}>Invoices</MenuItem>
 *   </MenuSection>
 *   <MenuSection title="Actions">
 *     <MenuItem onAction={newInvoice} shortcut="N">New invoice</MenuItem>
 *   </MenuSection>
 * </CommandPalette>
 */
export function CommandPalette({
  open,
  onOpenChange,
  children,
  'aria-label': ariaLabel = 'Command palette',
  placeholder = 'Type a command or search…',
  emptyState = (search) => `No results for “${search}”`,
  openShortcut = true,
}: CommandPaletteProps) {
  // "contains", ignoring case and accents: "inv" finds "Go to invoices", "cafe" finds "Café".
  const { contains } = useFilter({ sensitivity: 'base' });

  useEffect(() => {
    if (!openShortcut) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === 'k' &&
        (e.metaKey || e.ctrlKey) &&
        !e.altKey
      ) {
        e.preventDefault(); // Ctrl+K focuses the browser's search bar in some browsers
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange, openShortcut]);

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable
      className={cn(
        // Near the top, not centred: the list grows downward as you type less.
        'fixed inset-0 z-50 flex items-start justify-center bg-backdrop px-4 pt-[12vh]',
        'motion-safe:data-entering:animate-overlay-in motion-safe:data-exiting:animate-overlay-out',
      )}
    >
      <Modal
        className={cn(
          'flex max-h-[min(32rem,76vh)] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-border bg-bg text-fg shadow-xl outline-hidden',
          'motion-safe:data-entering:animate-dialog-in motion-safe:data-exiting:animate-dialog-out',
        )}
      >
        <AriaDialog
          aria-label={ariaLabel}
          className="flex min-h-0 flex-1 flex-col outline-hidden"
        >
          <Autocomplete filter={contains}>
            <AriaSearchField
              aria-label={placeholder}
              autoFocus
              className="group flex items-center gap-2 border-b border-border px-4"
            >
              <SearchIcon className="size-4 shrink-0 text-fg-muted" />
              <Input
                placeholder={placeholder}
                className="h-12 min-w-0 flex-1 bg-transparent text-base outline-hidden placeholder:text-fg-muted [&::-webkit-search-cancel-button]:hidden"
              />
            </AriaSearchField>
            <AriaMenu
              // Runs after the item's own onAction / href: the palette's job is done.
              onAction={() => onOpenChange(false)}
              renderEmptyState={() => (
                <EmptyText>
                  <SearchText render={emptyState} />
                </EmptyText>
              )}
              className="min-h-0 flex-1 overflow-auto p-1 outline-hidden"
            >
              {children}
            </AriaMenu>
          </Autocomplete>
          <footer
            aria-hidden="true"
            className="flex gap-4 border-t border-border px-4 py-2 text-xs text-fg-muted"
          >
            <span>
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> move
            </span>
            <span>
              <Kbd>Enter</Kbd> run
            </span>
            <span>
              <Kbd>Esc</Kbd> close
            </span>
          </footer>
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 py-8 text-center text-sm text-fg-muted">{children}</p>
  );
}

/** Reads what was typed from Autocomplete's state, for the empty message. */
function SearchText({ render }: { render: (search: string) => ReactNode }) {
  const state = useContext(AutocompleteStateContext);
  return <>{render(state?.inputValue ?? '')}</>;
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <Keyboard className="rounded border border-border px-1 font-mono">
      {children}
    </Keyboard>
  );
}
