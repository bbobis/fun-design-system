import { cva } from 'class-variance-authority';
import { createContext, useContext, useRef, type ReactNode } from 'react';
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export type TabsVariant = 'underline' | 'pills' | 'enclosed';
export type TabsSize = 'sm' | 'md';

type TabsLook = { variant: TabsVariant; size: TabsSize; fullWidth: boolean };

/**
 * The look, set once on <Tabs> and read by TabList, Tab and TabPanel. Context, so the
 * app never repeats `variant` on each Tab (and can't mix looks in one row). The default
 * value is today's look, so a Tab rendered on its own still gets a sensible style.
 */
const TabsLookContext = createContext<TabsLook>({
  variant: 'underline',
  size: 'md',
  fullWidth: false,
});

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
  /**
   * How the tabs look. Set it here, once: every Tab and TabPanel inside follows.
   * - `underline`: text tabs on a line; the selected one is underlined.
   * - `pills`: rounded buttons; the selected one is filled.
   * - `enclosed`: folder tabs; the selected one joins a bordered panel.
   * @default 'underline'
   */
  variant?: TabsVariant;
  /** @default 'md' */
  size?: TabsSize;
  /** The tabs share the full width equally. Good for 2–4 short tabs on small screens. @default false */
  fullWidth?: boolean;
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
  variant = 'underline',
  size = 'md',
  fullWidth = false,
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
      <TabsLookContext.Provider value={{ variant, size, fullWidth }}>
        {children}
      </TabsLookContext.Provider>
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

const listVariants = cva('flex', {
  variants: {
    variant: {
      underline: 'gap-1 border-b border-border',
      pills: 'gap-1',
      enclosed: 'gap-0.5 border-b border-border',
    },
  },
});

/** The row of tabs. Its look comes from the surrounding `Tabs`. */
export function TabList({
  'aria-label': ariaLabel,
  children,
  className,
}: TabListProps) {
  const { variant } = useContext(TabsLookContext);
  return (
    <AriaTabList
      aria-label={ariaLabel}
      className={cn(listVariants({ variant }), className)}
    >
      {children}
    </AriaTabList>
  );
}

export type TabProps = {
  /** Matches the `id` of its `TabPanel`, and is what `value` / `onChange` use. */
  id: string;
  /** The label. */
  children: ReactNode;
  /** A small icon before the label. Decoration: hidden from screen readers. */
  icon?: ReactNode;
  /**
   * A number after the label ("Lines 12"), shown as a small pill. Screen readers hear
   * "Lines, 12".
   */
  count?: number;
  disabled?: boolean;
};

const tabVariants = cva(
  [
    'relative flex cursor-pointer items-center justify-center gap-1.5 font-medium whitespace-nowrap text-fg-muted outline-hidden transition-colors',
    'hover:text-fg',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:text-fg-muted',
    'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
  ],
  {
    variants: {
      variant: {
        // Selected: full-colour text and a primary underline (colour is not the only
        // signal: the underline and aria-selected carry it too).
        underline:
          '-mb-px border-b-2 border-transparent data-selected:border-primary data-selected:text-fg data-focus-visible:rounded-t-md data-focus-visible:-outline-offset-2',
        // Selected: filled. The fill is the signal, and its text uses the on-primary
        // token so it keeps contrast on the brand colour.
        pills:
          'rounded-full hover:bg-surface data-selected:bg-primary data-selected:text-on-primary data-selected:hover:bg-primary-hover data-focus-visible:outline-offset-2',
        // Selected: a box whose bottom edge is the panel's colour, so it opens into
        // the panel below (-mb-px covers the list's border line).
        enclosed:
          '-mb-px rounded-t-md border border-transparent hover:bg-surface data-selected:border-border data-selected:border-b-bg data-selected:bg-bg data-selected:text-fg data-selected:hover:bg-bg data-focus-visible:-outline-offset-2',
      },
      size: {
        sm: 'px-2.5 py-1.5 text-xs',
        md: 'px-3 py-2 text-sm',
      },
      fullWidth: { true: 'flex-1', false: '' },
    },
    compoundVariants: [
      // Pills sit in less vertical room than underlined text.
      { variant: 'pills', size: 'sm', className: 'py-1' },
      { variant: 'pills', size: 'md', className: 'py-1.5' },
    ],
  },
);

export function Tab({ id, children, icon, count, disabled }: TabProps) {
  const look = useContext(TabsLookContext);
  return (
    <AriaTab id={id} isDisabled={disabled} className={tabVariants(look)}>
      {icon && (
        <span
          aria-hidden="true"
          className={cn('shrink-0', look.size === 'sm' ? 'size-3.5' : 'size-4')}
        >
          {icon}
        </span>
      )}
      {children}
      {count !== undefined && (
        <>
          {/* A comma, not a space: name computation trims a leading space, and
              "Lines12" would run together. */}
          <span className="sr-only">, {count}</span>
          <span
            aria-hidden="true"
            className={cn(
              'min-w-5 rounded-full bg-surface px-1.5 text-center text-xs leading-5 font-medium tabular-nums text-fg',
              // On a filled (pills) tab the grey pill would vanish into the fill.
              look.variant === 'pills' && 'in-data-selected:bg-bg',
            )}
          >
            {count}
          </span>
        </>
      )}
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
  const { variant } = useContext(TabsLookContext);
  return (
    <AriaTabPanel
      id={id}
      className={cn(
        'outline-hidden data-focus-visible:rounded-md data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        // Enclosed: the panel is the box the selected tab opens into.
        variant === 'enclosed'
          ? 'rounded-b-md border border-t-0 border-border p-4 data-focus-visible:rounded-t-none'
          : 'pt-4',
        className,
      )}
    >
      {children}
    </AriaTabPanel>
  );
}
