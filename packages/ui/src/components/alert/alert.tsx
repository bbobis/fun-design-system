import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { statusIcons, XIcon } from './status-icons';

const alertVariants = cva('flex border', {
  variants: {
    /**
     * Like Badge: a tone only *names* its colors as CSS variables; the variant picks
     * which of them paint the fill, border, text and icon.
     */
    tone: {
      // No colour of its own: grey surface, page text, the strong border.
      neutral:
        '[--alert-soft:var(--color-surface)] [--alert-on-soft:var(--color-fg)] [--alert-solid:var(--color-fg)] [--alert-on-solid:var(--color-bg)] [--alert-line:var(--color-border)] [--alert-strong-line:var(--color-border-strong)]',
      info: '[--alert-soft:var(--color-info-soft)] [--alert-on-soft:var(--color-on-info-soft)] [--alert-solid:var(--color-info)] [--alert-on-solid:var(--color-on-info)] [--alert-line:color-mix(in_oklab,var(--color-info)_30%,transparent)] [--alert-strong-line:var(--color-info)]',
      success:
        '[--alert-soft:var(--color-success-soft)] [--alert-on-soft:var(--color-on-success-soft)] [--alert-solid:var(--color-success)] [--alert-on-solid:var(--color-on-success)] [--alert-line:color-mix(in_oklab,var(--color-success)_30%,transparent)] [--alert-strong-line:var(--color-success)]',
      warning:
        '[--alert-soft:var(--color-warning-soft)] [--alert-on-soft:var(--color-on-warning-soft)] [--alert-solid:var(--color-warning)] [--alert-on-solid:var(--color-on-warning)] [--alert-line:color-mix(in_oklab,var(--color-warning)_40%,transparent)] [--alert-strong-line:var(--color-warning)]',
      danger:
        '[--alert-soft:var(--color-danger-soft)] [--alert-on-soft:var(--color-on-danger-soft)] [--alert-solid:var(--color-danger)] [--alert-on-solid:var(--color-on-danger)] [--alert-line:color-mix(in_oklab,var(--color-danger)_30%,transparent)] [--alert-strong-line:var(--color-danger)]',
    },
    variant: {
      // Light fill + dark text, reversed in dark mode (the same soft tokens as Badge).
      soft: 'border-(--alert-line) bg-(--alert-soft) text-(--alert-on-soft)',
      // The page's own background and text; the tone is the border and the icon. The
      // icon uses the soft-text token, which contrasts with the page in both themes.
      outline:
        'border-(--alert-strong-line) bg-bg text-fg [--alert-icon:var(--alert-on-soft)]',
      // A plain card with a thick coloured edge on the start side (left in English,
      // right in Arabic): the same look as Toast's `bar`. `border-s-*` = "start" side.
      bar: 'border-border border-s-4 border-s-(--alert-strong-line) bg-bg text-fg [--alert-icon:var(--alert-on-soft)]',
      // Strongest: for the one message that must not be missed.
      solid: 'border-transparent bg-(--alert-solid) text-(--alert-on-solid)',
    },
    size: {
      md: 'items-start gap-3 px-4 py-3 text-sm',
      sm: 'items-center gap-2 px-3 py-2 text-sm',
    },
    banner: {
      // Full-bleed across the top of a page or card: square, only a bottom edge.
      true: 'rounded-none border-x-0 border-t-0',
      false: 'rounded-md',
    },
  },
  defaultVariants: { tone: 'info', variant: 'soft', size: 'md', banner: false },
});

type Tone = NonNullable<VariantProps<typeof alertVariants>['tone']>;
export type AlertVariant = NonNullable<
  VariantProps<typeof alertVariants>['variant']
>;

/** Read before the title, so the tone isn't carried by color and icon alone. */
const toneWord: Record<Tone, string | null> = {
  neutral: null,
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
};

export type AlertProps = {
  /**
   * `neutral` is grey, for news with no good or bad in it ("New version available").
   * @default 'info'
   */
  tone?: Tone;
  /**
   * - `soft`: tinted box (most messages).
   * - `outline`: the page's background with a coloured border and icon; quieter, for
   *   pages with several alerts.
   * - `bar`: the page's background with a thick coloured edge on the start side
   *   (the same look as Toast's `bar`).
   * - `solid`: strong fill, for the one message that must not be missed.
   * @default 'soft'
   */
  variant?: AlertVariant;
  /**
   * `sm`: one compact line (title and text inline, actions on the right), for tables,
   * cards and side panels. @default 'md'
   */
  size?: 'sm' | 'md';
  /**
   * Full width across the top of a page or card: square corners, only a bottom edge.
   * It is still an alert, not the page's `banner` landmark. @default false
   */
  banner?: boolean;
  /**
   * Replace the tone's icon with your own (decorative: give it `aria-hidden`), or
   * `false` for no icon. @default the tone's icon
   */
  icon?: ReactNode | false;
  /** One short line in bold: what happened ("Payment failed"). */
  title?: string;
  /** Details, and what the user can do about it. */
  children?: ReactNode;
  /** Buttons or links, shown under the text (e.g. "Retry", "View invoice"). */
  actions?: ReactNode;
  /**
   * Shows a × that calls this. Leave it out for alerts that must stay until the
   * problem is fixed (errors on a form).
   */
  onDismiss?: () => void;
  /**
   * Announce the alert to screen readers when it **appears** (after a save, a failed
   * request). `danger` and `warning` interrupt (`role="alert"`); others wait their turn
   * (`role="status"`). Leave it off for alerts that are on the page from the start:
   * they're read in order like any other content, without interrupting.
   *
   * Screen readers reliably announce a newly added `role="alert"`; a newly added
   * `role="status"` is hit and miss. For "Saved"-style confirmations that come and go,
   * use a Toast instead.
   * @default false
   */
  announce?: boolean;
  className?: string;
};

/**
 * A message box inside the page: a failed save, a warning about the data, a hint.
 * The tone is said in words too ("Warning: …"), not only by color and icon.
 *
 * For a short message that comes and goes on its own, use a Toast. For a question that
 * needs an answer, an AlertDialog.
 */
export function Alert({
  tone = 'info',
  variant = 'soft',
  size = 'md',
  banner = false,
  title,
  children,
  actions,
  onDismiss,
  announce = false,
  icon,
  className,
}: AlertProps) {
  const t: Tone = tone ?? 'info';
  const Icon = statusIcons[t];
  const word = toneWord[t];
  // Outline and bar sit on the page's background: the icon takes the tone's
  // readable colour (--alert-icon). Soft and solid icons follow the text.
  const iconColour = variant === 'outline' || variant === 'bar';
  const compact = size === 'sm';
  return (
    <div
      role={
        announce
          ? t === 'danger' || t === 'warning'
            ? 'alert'
            : 'status'
          : undefined
      }
      className={cn(
        alertVariants({ tone: t, variant, size, banner }),
        className,
      )}
    >
      {icon !== false && (
        <span
          className={cn(
            'flex shrink-0 *:size-4',
            compact ? '' : 'mt-0.5',
            iconColour && 'text-(--alert-icon)',
          )}
        >
          {icon ?? <Icon />}
        </span>
      )}
      <div
        className={cn(
          'min-w-0 flex-1',
          // Compact: title, text and actions share one line (wrapping if they must).
          compact && 'flex flex-wrap items-center gap-x-2 gap-y-1',
        )}
      >
        {title ? (
          <p className="font-semibold">
            {word && <span className="sr-only">{word}: </span>}
            {title}
          </p>
        ) : (
          word && <span className="sr-only">{word}: </span>
        )}
        {children && (
          <div className={cn(title && !compact && 'mt-0.5')}>{children}</div>
        )}
        {actions && (
          <div
            className={cn('flex flex-wrap gap-2', compact ? 'ms-auto' : 'mt-2')}
          >
            {actions}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className={cn(
            '-me-1 flex size-6 shrink-0 items-center justify-center rounded opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-focus-ring',
            !compact && '-mt-0.5',
          )}
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}
