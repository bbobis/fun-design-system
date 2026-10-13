import { cva, type VariantProps } from 'class-variance-authority';
import {
  createContext,
  useContext,
  type ComponentProps,
  type ElementType,
  type ReactNode,
} from 'react';
import { Link as AriaLink, type LinkProps } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Heading, type HeadingLevel } from '../heading';
import { Text } from '../text';

/** Controls inside a clickable card that must stay clickable above the link's overlay. */
const raiseControls =
  'has-[[data-card-link]]:[&_:is(a,button,input,select,textarea,[tabindex]):not([data-card-link])]:relative ' +
  'has-[[data-card-link]]:[&_:is(a,button,input,select,textarea,[tabindex]):not([data-card-link])]:z-10';

/** Card's look. Exported for our own card-like components (RadioCard), not from the package. */
export const cardVariants = cva(
  [
    'rounded-lg text-fg',
    // Only when the card holds a CardLink (no extra prop needed):
    'has-[[data-card-link]]:relative has-[[data-card-link]]:transition-colors',
    'has-[[data-card-link]:hover]:border-border-strong has-[[data-card-link]:hover]:shadow-sm',
    'has-[[data-card-link][data-focus-visible]]:outline-2 has-[[data-card-link][data-focus-visible]]:outline-offset-2 has-[[data-card-link][data-focus-visible]]:outline-focus-ring',
    raiseControls,
  ],
  {
    variants: {
      variant: {
        outline: 'border border-border bg-bg',
        filled: 'bg-surface',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-8',
      },
    },
    defaultVariants: { variant: 'outline', padding: 'md' },
  },
);

type CardElement = 'div' | 'section' | 'article' | 'aside';

export type CardProps<T extends CardElement = 'div'> = {
  /**
   * The HTML element to render. Use `section` (with a heading inside) or `article` when
   * the card is a meaningful region; `div` when it's only visual grouping.
   * @default 'div'
   */
  as?: T;
} & Omit<ComponentProps<T>, 'as'> &
  VariantProps<typeof cardVariants>;

/** A container that groups related content. Layout inside is up to the app. */
export function Card<T extends CardElement = 'div'>({
  as,
  variant,
  padding,
  className,
  ...rest
}: CardProps<T>) {
  // Inside the function TS can't prove `rest` matches whichever tag T is, so the
  // local variable is typed loosely. Callers still get the strict CardProps<T>.
  const Component = (as ?? 'div') as ElementType;
  return (
    <CardPadding.Provider value={padding ?? 'md'}>
      <Component
        className={cn(cardVariants({ variant, padding }), className)}
        {...rest}
      />
    </CardPadding.Provider>
  );
}

type Padding = NonNullable<VariantProps<typeof cardVariants>['padding']>;

/** The Card's padding, so CardMedia can stretch past it to the edges. */
const CardPadding = createContext<Padding>('md');

/** Space between parts: only after something, so the first part sits flush. */
const partSpacing = 'not-first:mt-4';

export type CardMediaProps = {
  /** An `<img>`, `<video>` or illustration. It fills the width. */
  children: ReactNode;
  className?: string;
};

/**
 * An edge-to-edge image at the **top** of a Card (put it first). It cancels the Card's
 * padding, whatever size that is, and takes the Card's top corners.
 */
export function CardMedia({ children, className }: CardMediaProps) {
  const bleed = {
    none: '',
    sm: '-mx-3 -mt-3',
    md: '-mx-5 -mt-5',
    lg: '-mx-8 -mt-8',
  }[useContext(CardPadding)];
  return (
    <div
      className={cn(
        'overflow-hidden rounded-t-[inherit] [&>img]:block [&>img]:w-full [&>img]:object-cover',
        bleed,
        partSpacing,
        className,
      )}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = {
  /** The card's title. Can be a `CardLink` to make the whole card clickable. */
  title: ReactNode;
  /** A muted line under the title. */
  description?: ReactNode;
  /** Small controls on the right: a Badge, a Menu, an icon Button. */
  actions?: ReactNode;
  /**
   * The title's heading level. Pick the one that fits the page outline.
   * @default 3
   */
  headingLevel?: HeadingLevel;
  /** Put on the title so `<Card as="section" aria-labelledby={id}>` is named by it. */
  titleId?: string;
  className?: string;
};

/** The top of a Card: title, optional description, optional actions on the right. */
export function CardHeader({
  title,
  description,
  actions,
  headingLevel = 3,
  titleId,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3',
        partSpacing,
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <Heading level={headingLevel} size="sm" id={titleId}>
          {title}
        </Heading>
        {description && (
          <Text tone="muted" size="sm">
            {description}
          </Text>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export type CardBodyProps = ComponentProps<'div'>;

/** The main content of a Card. */
export function CardBody({ className, ...rest }: CardBodyProps) {
  return (
    <div className={cn('text-sm text-fg', partSpacing, className)} {...rest} />
  );
}

export type CardFooterProps = ComponentProps<'div'>;

/** The bottom of a Card: a divider, then actions on the right ("Cancel", "Save"). */
export function CardFooter({ className, ...rest }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4',
        partSpacing,
        className,
      )}
      {...rest}
    />
  );
}

export type CardLinkProps = Omit<
  LinkProps,
  'className' | 'style' | 'children'
> & {
  /** Where the card goes. */
  href: string;
  /** The link text: usually the card's title. This is what screen readers announce. */
  children: ReactNode;
  className?: string;
};

/**
 * Makes the whole Card clickable. Put it around the card's **title**, inside a Card:
 *
 * - The link's `::after` stretches over the card, so a click anywhere follows it.
 * - Screen readers hear only the title as the link name, not the whole card.
 * - It's a real `<a>`: middle-click, "open in new tab", and `RouterProvider` work.
 * - Buttons and links inside the card are raised above the overlay, so they still work.
 *   They are separate Tab stops after the card link.
 * - The Card gets a hover style and a focus ring around the whole card.
 *
 * Trade-off: text in the card can't be selected by dragging (the overlay catches it).
 *
 * @example
 * <Card as="article">
 *   <Heading level={3}><CardLink href="/invoices/1042">INV-1042</CardLink></Heading>
 *   <Text tone="muted">Northwind · $1,200</Text>
 *   <Button>Download</Button>
 * </Card>
 */
export function CardLink({ className, children, ...rest }: CardLinkProps) {
  return (
    <AriaLink
      data-card-link=""
      className={cn(
        'text-fg no-underline outline-hidden underline-offset-4 hover:underline',
        // The overlay that makes the whole card clickable.
        'after:absolute after:inset-0 after:rounded-[inherit]',
        className,
      )}
      {...rest}
    >
      {children}
    </AriaLink>
  );
}
