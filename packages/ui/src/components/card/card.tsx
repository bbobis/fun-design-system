import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ElementType, ReactNode } from 'react';
import { Link as AriaLink, type LinkProps } from 'react-aria-components';
import { cn } from '../../utils/cn';

/** Controls inside a clickable card that must stay clickable above the link's overlay. */
const raiseControls =
  'has-[[data-card-link]]:[&_:is(a,button,input,select,textarea,[tabindex]):not([data-card-link])]:relative ' +
  'has-[[data-card-link]]:[&_:is(a,button,input,select,textarea,[tabindex]):not([data-card-link])]:z-10';

const cardVariants = cva(
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
    <Component
      className={cn(cardVariants({ variant, padding }), className)}
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
