import { cx, type CxOptions } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

/**
 * Joins class names and resolves Tailwind conflicts.
 *
 * `cx` drops falsy values and flattens arrays, so `cn('a', cond && 'b')` works.
 * `twMerge` makes the last conflicting class win: `cn('px-4', 'px-2')` → `'px-2'`,
 * which is what lets an app's `className` override a component's own classes.
 */
export function cn(...inputs: CxOptions): string {
  return twMerge(cx(inputs));
}
