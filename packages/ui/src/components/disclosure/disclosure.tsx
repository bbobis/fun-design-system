import { createContext, useContext, type ReactNode } from 'react';
import {
  Button,
  Disclosure as AriaDisclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading,
  type Key,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { ChevronIcon } from '../combobox/combobox-parts';

/** True inside an Accordion: the group draws the box and dividers, not each section. */
const InAccordion = createContext(false);

export type DisclosureProps = {
  /** The always-visible title. It's the button that opens and closes the section. */
  title: ReactNode;
  /** The content that shows when open. */
  children: ReactNode;
  /** Needed inside an Accordion: what `expandedIds` refers to. */
  id?: string;
  /**
   * The title's heading level in the page outline (screen-reader users jump by
   * heading). Pick the level that fits where the section sits. @default 3
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Open or closed (controlled). Outside an Accordion only. */
  expanded?: boolean;
  /** Starts open when uncontrolled. Outside an Accordion only. */
  defaultExpanded?: boolean;
  /** Called with the new state when it opens or closes. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Can't be opened or closed. */
  disabled?: boolean;
  className?: string;
};

/**
 * A section whose content can be shown or hidden: "Show details", one FAQ answer, an
 * advanced-settings block. Inside an `Accordion`, sections share one border and
 * (by default) only one is open at a time.
 *
 * The title is a heading containing a button with `aria-expanded`; Enter or Space
 * toggles it. A closed panel uses `hidden="until-found"`, so the browser's find
 * (Ctrl/⌘+F) still searches it and opens the section on a match.
 * Built on React Aria `Disclosure`.
 *
 * @example
 * <Disclosure title="Payment details">…</Disclosure>
 */
export function Disclosure({
  title,
  children,
  id,
  headingLevel = 3,
  expanded,
  defaultExpanded,
  onExpandedChange,
  disabled,
  className,
}: DisclosureProps) {
  const inAccordion = useContext(InAccordion);
  return (
    <AriaDisclosure
      id={id}
      isExpanded={expanded}
      defaultExpanded={defaultExpanded}
      onExpandedChange={onExpandedChange}
      isDisabled={disabled}
      className={cn(
        'group/disclosure bg-bg',
        // On its own it's a bordered box; inside an Accordion the group draws the box
        // and the dividers (a border here would fight the group's divide-y).
        !inAccordion && 'rounded-md border border-border',
        className,
      )}
    >
      <Heading level={headingLevel} className="m-0 text-sm font-medium text-fg">
        <Button
          slot="trigger"
          className={cn(
            'flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-4 py-3 text-start outline-hidden',
            'hover:bg-surface',
            'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
            'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:bg-transparent',
            inAccordion && 'rounded-none',
          )}
        >
          {title}
          {/* Turns to point up when open. Decorative: aria-expanded says it. */}
          <ChevronIcon className="size-4 shrink-0 text-fg-muted transition-transform motion-reduce:transition-none group-data-expanded/disclosure:rotate-180" />
        </Button>
      </Heading>
      {/* React Aria sets --disclosure-panel-height (0 → the content's height) so the
          panel can slide; motion-safe only, per the recipe's motion rule. */}
      <DisclosurePanel className="h-(--disclosure-panel-height) overflow-clip motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out">
        <div className="px-4 pb-4 text-sm text-fg">{children}</div>
      </DisclosurePanel>
    </AriaDisclosure>
  );
}

export type AccordionProps = {
  /** `Disclosure` sections, each with an `id`. */
  children: ReactNode;
  /** Let several sections be open at once. @default false (opening one closes the other) */
  allowsMultiple?: boolean;
  /** The open sections' ids (controlled). */
  expandedIds?: readonly string[];
  /** The sections open at first when uncontrolled. */
  defaultExpandedIds?: readonly string[];
  /** Called with every open id after a section opens or closes. */
  onExpandedChange?: (ids: string[]) => void;
  /** Disables every section. */
  disabled?: boolean;
  className?: string;
};

/**
 * A stack of `Disclosure` sections in one bordered box: an FAQ, settings groups,
 * filter panels. Each section is still its own heading + button, so Tab moves between
 * titles (no arrow-key roving: the headings are page structure, not one widget).
 * Built on React Aria `DisclosureGroup`.
 *
 * @example
 * <Accordion defaultExpandedIds={['refunds']}>
 *   <Disclosure id="refunds" title="How do refunds work?">…</Disclosure>
 *   <Disclosure id="invoices" title="Where are my invoices?">…</Disclosure>
 * </Accordion>
 */
export function Accordion({
  children,
  allowsMultiple = false,
  expandedIds,
  defaultExpandedIds,
  onExpandedChange,
  disabled,
  className,
}: AccordionProps) {
  return (
    <DisclosureGroup
      allowsMultipleExpanded={allowsMultiple}
      expandedKeys={expandedIds}
      defaultExpandedKeys={defaultExpandedIds}
      onExpandedChange={
        onExpandedChange &&
        ((keys: Set<Key>) => onExpandedChange([...keys].map(String)))
      }
      isDisabled={disabled}
      className={cn(
        'flex flex-col divide-y divide-border rounded-md border border-border bg-bg',
        className,
      )}
    >
      <InAccordion.Provider value>{children}</InAccordion.Provider>
    </DisclosureGroup>
  );
}
