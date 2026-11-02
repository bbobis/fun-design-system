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
    'flex max-w-full cursor-default items-center gap-0.5 border outline-hidden',
    // The tone (below) names the colors; these paint them. Same idea as Badge.
    'border-(--tag-line) bg-(--tag-bg) text-(--tag-fg)',
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
      /**
       * Colors for status tags ("Overdue"). `neutral` is the plain chip. Each tone
       * sets four variables: fill, text, border, and the ✕'s resting color (muted
       * on neutral; the tone's text color otherwise, so it keeps its contrast on
       * the tinted fill). Selection (primary tint + ✓) still wins over the tone.
       */
      tone: {
        neutral:
          '[--tag-bg:var(--color-surface)] [--tag-fg:var(--color-fg)] [--tag-line:var(--color-border)] [--tag-muted:var(--color-fg-muted)]',
        info: '[--tag-bg:var(--color-info-soft)] [--tag-fg:var(--color-on-info-soft)] [--tag-line:color-mix(in_oklab,var(--color-info)_30%,transparent)] [--tag-muted:var(--color-on-info-soft)]',
        success:
          '[--tag-bg:var(--color-success-soft)] [--tag-fg:var(--color-on-success-soft)] [--tag-line:color-mix(in_oklab,var(--color-success)_30%,transparent)] [--tag-muted:var(--color-on-success-soft)]',
        warning:
          '[--tag-bg:var(--color-warning-soft)] [--tag-fg:var(--color-on-warning-soft)] [--tag-line:color-mix(in_oklab,var(--color-warning)_40%,transparent)] [--tag-muted:var(--color-on-warning-soft)]',
        danger:
          '[--tag-bg:var(--color-danger-soft)] [--tag-fg:var(--color-on-danger-soft)] [--tag-line:color-mix(in_oklab,var(--color-danger)_30%,transparent)] [--tag-muted:var(--color-on-danger-soft)]',
      },
      /** `pill` is fully round. The ✕ follows (it reads the --tag-radius variable). */
      shape: {
        rounded: 'rounded [--tag-radius:0.25rem]',
        pill: 'rounded-full [--tag-radius:9999px]',
      },
      /** Selectable chips are pressed, so they get a pointer and a hover. */
      interactive: { true: 'cursor-pointer hover:bg-border/60', false: '' },
      /** Without a remove button, the end padding matches the start. */
      removable: { true: '', false: 'pe-2' },
    },
    compoundVariants: [{ size: 'md', removable: false, class: 'pe-2.5' }],
    defaultVariants: {
      size: 'sm',
      tone: 'neutral',
      shape: 'rounded',
      interactive: false,
      removable: true,
    },
  },
);

/** The ✕ in a chip. slot="remove": React Aria names it ("Remove Germany") and wires it. */
export function TagRemoveButton() {
  return (
    <Button
      slot="remove"
      className={cn(
        'rounded-(--tag-radius) p-0.5 text-(--tag-muted) outline-hidden hover:bg-fg/10 hover:text-(--tag-fg)',
        // It takes keyboard focus, so it needs a visible ring (WCAG 2.4.7). outline-solid
        // is required: outline-hidden sets the style to none, outline-2 only the width.
        'data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
      )}
    >
      <XIcon className="size-3.5" />
    </Button>
  );
}
