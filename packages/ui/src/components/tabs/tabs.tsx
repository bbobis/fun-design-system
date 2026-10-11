import { useRef, type ReactNode } from 'react';
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export type TabsProps = {
  /** The selected tab's `id` (controlled). */
  value?: string;
  /** Starting tab when uncontrolled. Default: the first one. */
  defaultValue?: string;
  /** Called with the tab's `id` when the user picks a tab. Not called on mount. */
  onChange?: (value: string) => void;
  /**
   * `automatic` (default): arrow keys move *and* show the panel. `manual`: arrows only
   * move focus; Enter or Space shows it. Use `manual` when a panel is slow to load,
   * so arrowing past it doesn't start loading every panel on the way.
   * @default 'automatic'
   */
  keyboardActivation?: 'automatic' | 'manual';
  /** `TabList` followed by one `TabPanel` per tab. */
  children: ReactNode;
  className?: string;
};

/**
 * Switch between views of the same thing (an invoice's Details / Lines / History)
 * without leaving the page. For moving to another page, use links (navigation),
 * not tabs.
 *
 * Keyboard: the tab list is one Tab stop; ←/→ move between tabs, Home/End jump to the
 * ends; Tab moves into the panel. Built on React Aria `Tabs` (`tablist` / `tab` /
 * `tabpanel`, each panel labelled by its tab).
 *
 * @example
 * <Tabs defaultValue="details">
 *   <TabList aria-label="Invoice">
 *     <Tab id="details">Details</Tab>
 *     <Tab id="history">History</Tab>
 *   </TabList>
 *   <TabPanel id="details">…</TabPanel>
 *   <TabPanel id="history">…</TabPanel>
 * </Tabs>
 */
export function Tabs({
  value,
  defaultValue,
  onChange,
  keyboardActivation = 'automatic',
  children,
  className,
}: TabsProps) {
  // React Aria also calls onSelectionChange on mount when it picks the first tab by
  // itself (no value/defaultValue). onChange should mean "the user picked a tab", so
  // we remember the current tab and skip that first auto-pick.
  const current = useRef<string | null>(value ?? defaultValue ?? null);
  if (value !== undefined) current.current = value;

  return (
    <AriaTabs
      selectedKey={value}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => {
        const next = String(key);
        const isAutoPick = current.current === null;
        current.current = next;
        if (!isAutoPick) onChange?.(next);
      }}
      keyboardActivation={keyboardActivation}
      className={cn('flex flex-col', className)}
    >
      {children}
    </AriaTabs>
  );
}

export type TabListProps = {
  /** Names the set of tabs for screen readers ("Invoice sections"). Required. */
  'aria-label': string;
  /** `Tab` elements. */
  children: ReactNode;
  className?: string;
};

/** The row of tabs. Sits on a bottom border; the selected tab is underlined. */
export function TabList({
  'aria-label': ariaLabel,
  children,
  className,
}: TabListProps) {
  return (
    <AriaTabList
      aria-label={ariaLabel}
      className={cn('flex gap-1 border-b border-border', className)}
    >
      {children}
    </AriaTabList>
  );
}

export type TabProps = {
  /** Matches the `id` of its `TabPanel`, and is what `value` / `onChange` use. */
  id: string;
  /** The label. Can include a count, e.g. `Lines <Badge>12</Badge>`. */
  children: ReactNode;
  disabled?: boolean;
};

export function Tab({ id, children, disabled }: TabProps) {
  return (
    <AriaTab
      id={id}
      isDisabled={disabled}
      className={cn(
        'relative -mb-px flex cursor-pointer items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-fg-muted outline-hidden transition-colors',
        'hover:text-fg',
        // The selected tab: full-colour text and a primary underline (colour is not the
        // only signal: the underline and aria-selected carry it too).
        'data-selected:border-primary data-selected:text-fg',
        'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:text-fg-muted',
        'data-focus-visible:rounded-t-md data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
      )}
    >
      {children}
    </AriaTab>
  );
}

export type TabPanelProps = {
  /** The `id` of the tab that shows it. */
  id: string;
  children: ReactNode;
  className?: string;
};

/**
 * The content for one tab. Only the selected panel is rendered. The panel itself is
 * focusable when it has nothing focusable inside, so Tab from the list always lands
 * somewhere.
 */
export function TabPanel({ id, children, className }: TabPanelProps) {
  return (
    <AriaTabPanel
      id={id}
      className={cn(
        'pt-4 outline-hidden data-focus-visible:rounded-md data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        className,
      )}
    >
      {children}
    </AriaTabPanel>
  );
}
