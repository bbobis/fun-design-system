import { cva } from 'class-variance-authority';
import { Button } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { XIcon } from '../combobox/combobox-parts';

/**
 * One chip's look, shared by TagGroup and MultiCombobox (put on React Aria's `Tag`).
 * Selected chips (TagGroup with `selectionMode`) get the primary tint.
 */
export const tagVariants = cva(
  [
    'flex max-w-full cursor-default items-center gap-0.5 rounded border border-border bg-surface text-fg outline-hidden',
    'transition-colors',
    // outline-solid is required: outline-hidden above sets --tw-outline-style:none,
    // which outline-2 would otherwise inherit (same trap as Button).
    'data-focus-visible:outline-2 data-focus-visible:outline-offset-1 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
    'data-selected:border-primary data-selected:bg-primary/15',
    'data-disabled:cursor-not-allowed data-disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-6 ps-2 pe-0.5 text-sm',
        md: 'h-8 ps-2.5 pe-1 text-sm',
      },
      /** Selectable chips are pressed, so they get a pointer and a hover. */
      interactive: { true: 'cursor-pointer hover:bg-border/60', false: '' },
      /** Without a remove button, the end padding matches the start. */
      removable: { true: '', false: 'pe-2' },
    },
    compoundVariants: [{ size: 'md', removable: false, class: 'pe-2.5' }],
    defaultVariants: { size: 'sm', interactive: false, removable: true },
  },
);

/** The ✕ in a chip. slot="remove": React Aria names it ("Remove Germany") and wires it. */
export function TagRemoveButton() {
  return (
    <Button
      slot="remove"
      className={cn(
        'rounded p-0.5 text-fg-muted outline-hidden hover:bg-border hover:text-fg',
        // It takes keyboard focus, so it needs a visible ring (WCAG 2.4.7). outline-solid
        // is required: outline-hidden sets the style to none, outline-2 only the width.
        'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
      )}
    >
      <XIcon className="size-3.5" />
    </Button>
  );
}
