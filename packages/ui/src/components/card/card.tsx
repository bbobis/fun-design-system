import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ElementType } from 'react';
import { cn } from '../../utils/cn';

const cardVariants = cva('rounded-lg text-fg', {
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
});

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
