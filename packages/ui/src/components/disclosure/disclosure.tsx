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

export type DisclosureVariant = 'bordered' | 'separated' | 'flush' | 'filled';
export type DisclosureSize = 'sm' | 'md' | 'lg';

type DisclosureStyle = {
  variant: DisclosureVariant;
  size: DisclosureSize;
  chevronPosition: 'start' | 'end';
};

/**
 * Set by an Accordion for its sections (null outside one). In `bordered` and `flush`
 * the group draws the dividers; in `separated` and `filled` each section draws its own
 * box. A Disclosure's own props win over the Accordion's.
 */
const AccordionStyle = createContext<DisclosureStyle | null>(null);

/** The section's own box, per variant. In a bordered/flush Accordion the group draws it. */
const sectionBox: Record<DisclosureVariant, string> = {
  bordered: 'rounded-md border border-border bg-bg',
  separated: 'rounded-md border border-border bg-bg',
  flush: 'border-b border-border',
  filled: 'rounded-md bg-surface',
};

/** The group around the sections. */
const groupBox: Record<DisclosureVariant, string> = {
  bordered: 'divide-y divide-border rounded-md border border-border bg-bg',
  separated: 'gap-2',
  flush: 'divide-y divide-border border-y border-border',
  filled: 'gap-2',
};

/**
 * Per size. `indent` / `flushIndent`: with the arrow at the start, the content starts
 * where the title does (padding + arrow + gap; flush has no padding).
 */
const sizes = {
  sm: {
    trigger: 'gap-2 px-3 py-2 text-sm',
    panel: 'px-3 pb-3 text-sm',
    icon: 'size-3.5',
    indent: 'ps-[2.125rem]',
    flushIndent: 'ps-[1.375rem]',
  },
  md: {
    trigger: 'gap-3 px-4 py-3 text-sm',
    panel: 'px-4 pb-4 text-sm',
    icon: 'size-4',
    indent: 'ps-[2.75rem]',
    flushIndent: 'ps-7',
  },
  lg: {
    trigger: 'gap-3 px-5 py-4 text-base',
    panel: 'px-5 pb-5 text-base',
    icon: 'size-5',
    indent: 'ps-[3.25rem]',
    flushIndent: 'ps-8',
  },
} as const;

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
  /**
   * The look. Inside an Accordion, leave it unset to follow the Accordion's.
   * @default 'bordered'
   */
  variant?: DisclosureVariant;
  /** Title and padding size. Inside an Accordion, follows it unless set. @default 'md' */
  size?: DisclosureSize;
  /**
   * Where the arrow goes: `end` (points down, turns up when open) or `start` (points
   * right before the title, turns down when open, like a tree). Inside an Accordion,
   * follows it unless set. @default 'end'
   */
  chevronPosition?: 'start' | 'end';
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
  variant: ownVariant,
  size: ownSize,
  chevronPosition: ownChevron,
  className,
}: DisclosureProps) {
  const group = useContext(AccordionStyle);
  const variant = ownVariant ?? group?.variant ?? 'bordered';
  const size = sizes[ownSize ?? group?.size ?? 'md'];
  const chevronAtStart = (ownChevron ?? group?.chevronPosition) === 'start';
  // In a bordered or flush Accordion the group draws the box and the dividers; a
  // border here would double them.
  const groupDraws = group && (variant === 'bordered' || variant === 'flush');
  const flush = variant === 'flush';
  const chevron = (
    <ChevronIcon
      className={cn(
        'shrink-0 text-fg-muted transition-transform motion-reduce:transition-none',
        size.icon,
        chevronAtStart
          ? // Points right (left in RTL); turns down when open.
            '-rotate-90 rtl:rotate-90 group-data-expanded/disclosure:rotate-0 rtl:group-data-expanded/disclosure:rotate-0'
          : 'group-data-expanded/disclosure:rotate-180',
      )}
    />
  );
  return (
    <AriaDisclosure
      id={id}
      isExpanded={expanded}
      defaultExpanded={defaultExpanded}
      onExpandedChange={onExpandedChange}
      isDisabled={disabled}
      data-variant={variant}
      className={cn(
        'group/disclosure',
        groupDraws ? (flush ? '' : 'bg-bg') : sectionBox[variant],
        className,
      )}
    >
      <Heading level={headingLevel} className="m-0 text-fg">
        <Button
          slot="trigger"
          className={cn(
            'flex w-full cursor-pointer items-center rounded-md text-start font-medium outline-hidden',
            size.trigger,
            chevronAtStart ? 'justify-start' : 'justify-between',
            // filled sits on surface already, so its hover goes one step darker.
            variant === 'filled' ? 'hover:bg-border/40' : 'hover:bg-surface',
            // flush has no box: no side padding, so titles line up with the page.
            flush && 'rounded-none px-0 hover:bg-transparent hover:underline',
            groupDraws && 'rounded-none',
            'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
            'data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:bg-transparent data-disabled:hover:no-underline',
          )}
        >
          {/* The arrow is decorative: aria-expanded says open or closed. */}
          {chevronAtStart && chevron}
          {title}
          {!chevronAtStart && chevron}
        </Button>
      </Heading>
      {/* React Aria sets --disclosure-panel-height (0 → the content's height) so the
          panel can slide; motion-safe only, per the recipe's motion rule. */}
      <DisclosurePanel className="h-(--disclosure-panel-height) overflow-clip motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out">
        <div
          className={cn(
            'text-fg',
            size.panel,
            flush && 'px-0',
            // With the arrow at the start, the content lines up with the title.
            chevronAtStart && (flush ? size.flushIndent : size.indent),
          )}
        >
          {children}
        </div>
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
  /**
   * - `bordered`: one box with lines between sections.
   * - `separated`: each section its own card, with a gap.
   * - `flush`: no box and no side padding, lines only (inside a card or a sidebar).
   * - `filled`: soft gray sections, no borders.
   * @default 'bordered'
   */
  variant?: DisclosureVariant;
  /** Title and padding size for every section. @default 'md' */
  size?: DisclosureSize;
  /** Where every section's arrow goes. @default 'end' */
  chevronPosition?: 'start' | 'end';
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
  variant = 'bordered',
  size = 'md',
  chevronPosition = 'end',
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
      data-variant={variant}
      className={cn('flex flex-col', groupBox[variant], className)}
    >
      <AccordionStyle.Provider value={{ variant, size, chevronPosition }}>
        {children}
      </AccordionStyle.Provider>
    </DisclosureGroup>
  );
}
