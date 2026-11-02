import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ElementType } from 'react';
import { cn } from '../../utils/cn';

const textVariants = cva('font-sans', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    tone: {
      default: 'text-fg',
      muted: 'text-fg-muted',
      // Status text: say the status in words too ("Overdue"), not only by color.
      danger: 'text-fg-danger',
      success: 'text-fg-success',
      warning: 'text-fg-warning',
      info: 'text-fg-info',
      // Inherit the parent's color, e.g. inside a Badge or a Button.
      inherit: 'text-inherit',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
  },
  defaultVariants: { size: 'md', tone: 'default', weight: 'regular' },
});

export type Truncate = boolean | 2 | 3 | 4 | 5;

/**
 * Classes for `truncate`. Line clamps are listed out (not built from the number) so
 * Tailwind can find them in the source. Shared with Heading.
 */
export const truncateClass = (truncate: Truncate | undefined) =>
  truncate === true
    ? 'truncate'
    : truncate
      ? {
          2: 'line-clamp-2',
          3: 'line-clamp-3',
          4: 'line-clamp-4',
          5: 'line-clamp-5',
        }[truncate]
      : undefined;

/** Tags Text may render as. Kept small on purpose: Text is for running text, not layout. */
type TextElement = 'p' | 'span' | 'div' | 'strong' | 'em' | 'small';

/**
 * `T` is whichever tag `as` picks. `ComponentProps<T>` then gives exactly that tag's
 * props, so `<Text as="span">` accepts span attributes and a span ref.
 */
export type TextProps<T extends TextElement = 'p'> = {
  /** The HTML element to render. @default 'p' */
  as?: T;
  /**
   * Line up digits in columns (`font-variant-numeric: tabular-nums`). Use it for
   * any number that sits in a table or next to other numbers.
   * @default false
   */
  numeric?: boolean;
  /**
   * Cut long text: `true` keeps one line and ends it with "…"; a number (2–5) keeps
   * that many lines. Only the look is cut: screen readers and copy-paste get the
   * full text. Give it a width (it's a block, or a flex child with `min-w-0`).
   * @default false
   */
  truncate?: Truncate;
} & Omit<ComponentProps<T>, 'as'> &
  VariantProps<typeof textVariants>;

/**
 * Body text in the brand font and a token color.
 *
 * Polymorphic: `as` changes the tag, and the allowed props follow the tag.
 */
export function Text<T extends TextElement = 'p'>({
  as,
  size,
  tone,
  weight,
  numeric = false,
  truncate,
  className,
  ...rest
}: TextProps<T>) {
  // Inside the function TS can't prove `rest` matches whichever tag T is, so the
  // local variable is typed loosely. Callers still get the strict TextProps<T>.
  const Component = (as ?? 'p') as ElementType;
  return (
    <Component
      className={cn(
        textVariants({ size, tone, weight }),
        numeric && 'tabular-nums',
        truncateClass(truncate),
        className,
      )}
      {...rest}
    />
  );
}
