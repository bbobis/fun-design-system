import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode, SVGProps } from 'react';
import { cn } from '../../utils/cn';

const alertVariants = cva(
  'flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
  {
    variants: {
      tone: {
        // The same soft tokens as Badge: light fill + dark text, reversed in dark mode.
        info: 'border-info/30 bg-info-soft text-on-info-soft',
        success: 'border-success/30 bg-success-soft text-on-success-soft',
        warning: 'border-warning/40 bg-warning-soft text-on-warning-soft',
        danger: 'border-danger/30 bg-danger-soft text-on-danger-soft',
      },
    },
    defaultVariants: { tone: 'info' },
  },
);

type Tone = NonNullable<VariantProps<typeof alertVariants>['tone']>;

/** Read before the title, so the tone isn't carried by color and icon alone. */
const toneWord: Record<Tone, string> = {
  info: 'Information',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
};

export type AlertProps = VariantProps<typeof alertVariants> & {
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
  title,
  children,
  actions,
  onDismiss,
  announce = false,
  className,
}: AlertProps) {
  const t: Tone = tone ?? 'info';
  const Icon = icons[t];
  return (
    <div
      role={
        announce
          ? t === 'danger' || t === 'warning'
            ? 'alert'
            : 'status'
          : undefined
      }
      className={cn(alertVariants({ tone: t }), className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="font-semibold">
            <span className="sr-only">{toneWord[t]}: </span>
            {title}
          </p>
        ) : (
          <span className="sr-only">{toneWord[t]}: </span>
        )}
        {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
        {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="-me-1 -mt-0.5 flex size-6 shrink-0 items-center justify-center rounded opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}
const icons: Record<Tone, (p: SVGProps<SVGSVGElement>) => ReactNode> = {
  info: (p) => (
    <Svg {...p}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25v3.5M8 5.25h.01" />
    </Svg>
  ),
  success: (p) => (
    <Svg {...p}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="m5.5 8.25 1.75 1.75 3.25-3.75" />
    </Svg>
  ),
  warning: (p) => (
    <Svg {...p}>
      <path d="M8 2.25 1.75 13.25h12.5z" />
      <path d="M8 6.75v3M8 11.5h.01" />
    </Svg>
  ),
  danger: (p) => (
    <Svg {...p}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5" />
    </Svg>
  ),
};
function XIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p} strokeWidth={1.75}>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </Svg>
  );
}
