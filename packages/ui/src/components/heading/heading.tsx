import { cva } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { truncateClass, type Truncate } from '../text/text';

const headingVariants = cva('font-sans text-balance', {
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
      '2xl': 'text-3xl tracking-tight',
      // Display sizes for a hero or a landing page title. Tighter line height and
      // letter spacing: big type looks loose with body-text spacing.
      '3xl': 'text-4xl/tight tracking-tight',
      '4xl': 'text-5xl/tight tracking-tighter',
    },
    weight: {
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    tone: {
      default: 'text-fg',
      muted: 'text-fg-muted',
      // Takes the parent's color, e.g. a heading on a colored panel or a Banner.
      inherit: 'text-inherit',
    },
  },
  defaultVariants: { weight: 'semibold', tone: 'default' },
});

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

/** The size each level gets when `size` isn't set. */
const defaultSizeForLevel: Record<HeadingLevel, HeadingSize> = {
  1: '2xl',
  2: 'xl',
  3: 'lg',
  4: 'md',
  5: 'sm',
  6: 'xs',
};

export type HeadingProps = Omit<ComponentProps<'h2'>, 'children'> & {
  /**
   * Position in the page outline. Screen-reader users jump between headings by level,
   * so pick it from the page structure, not from how big it should look.
   */
  level: HeadingLevel;
  /** Visual size. Defaults to the size that matches `level`. */
  size?: HeadingSize;
  /** @default 'semibold' */
  weight?: 'medium' | 'semibold' | 'bold';
  /** @default 'default' */
  tone?: 'default' | 'muted' | 'inherit';
  /** Cut a long title: `true` for one line with "…", 2–5 for that many lines. @default false */
  truncate?: Truncate;
  /**
   * A small line above the title ("Billing" over "Invoices"). It sits *next to* the
   * heading, not inside it, so the heading's name stays "Invoices": screen-reader users
   * jumping by heading hear the title, not "Billing Invoices". The two are wrapped in
   * an `<hgroup>`, the HTML element for a heading plus its extra lines.
   */
  eyebrow?: ReactNode;
  children: ReactNode;
};

/**
 * `level` decides the tag (`h1`–`h6`); `size` decides the look. They're separate so a
 * small card title can still be an `h3`, and a large hero can still be an `h2`.
 *
 * `level` is required on purpose: there is no safe default for document structure.
 */
export function Heading({
  level,
  size,
  weight,
  tone,
  truncate,
  eyebrow,
  className,
  ...rest
}: HeadingProps) {
  const Tag = `h${level}` as const;
  const heading = (
    <Tag
      className={cn(
        headingVariants({
          size: size ?? defaultSizeForLevel[level],
          weight,
          tone,
        }),
        truncateClass(truncate),
        className,
      )}
      {...rest}
    />
  );
  if (eyebrow === undefined) return heading;
  return (
    <hgroup className="flex min-w-0 flex-col gap-1">
      <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">
        {eyebrow}
      </p>
      {heading}
    </hgroup>
  );
}
