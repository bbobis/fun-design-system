import { cva } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../../utils/cn';

const headingVariants = cva('font-sans font-semibold text-balance text-fg', {
  variants: {
    size: {
      xs: 'text-sm',
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
      '2xl': 'text-3xl tracking-tight',
    },
  },
});

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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
  children: React.ReactNode;
};

/**
 * `level` decides the tag (`h1`–`h6`); `size` decides the look. They're separate so a
 * small card title can still be an `h3`, and a large hero can still be an `h2`.
 *
 * `level` is required on purpose: there is no safe default for document structure.
 */
export function Heading({ level, size, className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        headingVariants({ size: size ?? defaultSizeForLevel[level] }),
        className,
      )}
      {...rest}
    />
  );
}
