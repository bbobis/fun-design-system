import { cva } from 'class-variance-authority';
import type { ReactNode, SVGProps } from 'react';
import {
  Button as AriaButton,
  Text,
  // React Aria marks Toast UNSTABLE_ (its API may still change in a minor release).
  // Only this file imports it, and react-aria-components is pinned to patch updates
  // (~1.21.1), so an upgrade is always a deliberate PR whose tests cover this.
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

export type ToastTone = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

/** What one toast shows. */
export type ToastContent = {
  /** One short line: what happened ("Invoice saved"). */
  title: string;
  /** An optional second line with details. */
  description?: string;
  /** @default 'neutral' */
  tone?: ToastTone;
  /**
   * One button, e.g. Undo or View. A toast with an action stays until it's closed:
   * people need time to reach it (WCAG 2.2.1).
   */
  action?: { label: string; onAction: () => void };
};

export type ToastOptions = {
  /**
   * Milliseconds before it closes by itself. Default: 5 s; but `danger` toasts and
   * toasts with an `action` stay until closed. Pass `null` to always stay.
   * Hovering or focusing the toast pauses the timer.
   */
  timeout?: number | null;
  /** Called when the toast closes (timeout, ×, or `toast.dismiss`). */
  onClose?: () => void;
};

/** The one queue for the whole app. `<ToastRegion />` shows what's in it. */
const queue = new ToastQueue<ToastContent>({ maxVisibleToasts: 4 });

function show(content: ToastContent, options: ToastOptions = {}): string {
  const sticky = content.tone === 'danger' || content.action !== undefined;
  const timeout =
    options.timeout === null
      ? undefined
      : (options.timeout ?? (sticky ? undefined : 5000));
  return queue.add(content, { timeout, onClose: options.onClose });
}

/**
 * Show a short message that comes and goes ("Saved", "3 rows failed"). Callable from
 * anywhere (event handlers, API code), no hook needed. Returns the toast's key.
 *
 * @example
 * toast.success('Invoice saved');
 * toast.danger('Couldn’t save', { description: 'The server didn’t respond.' });
 * const key = toast.show({ title: 'Deleted 3 rows', action: { label: 'Undo', onAction: undo } });
 * toast.dismiss(key);
 */
export const toast = {
  show,
  success: (
    title: string,
    rest: Omit<ToastContent, 'title' | 'tone'> = {},
    options?: ToastOptions,
  ) => show({ ...rest, title, tone: 'success' }, options),
  info: (
    title: string,
    rest: Omit<ToastContent, 'title' | 'tone'> = {},
    options?: ToastOptions,
  ) => show({ ...rest, title, tone: 'info' }, options),
  warning: (
    title: string,
    rest: Omit<ToastContent, 'title' | 'tone'> = {},
    options?: ToastOptions,
  ) => show({ ...rest, title, tone: 'warning' }, options),
  danger: (
    title: string,
    rest: Omit<ToastContent, 'title' | 'tone'> = {},
    options?: ToastOptions,
  ) => show({ ...rest, title, tone: 'danger' }, options),
  /** Close one toast early. */
  dismiss: (key: string) => queue.close(key),
};

/**
 * Like Alert and Badge: a tone only *names* its colors (CSS variables); the region's
 * `variant` picks which of them paint the toast.
 */
const toneColors = cva('', {
  variants: {
    tone: {
      neutral:
        '[--toast-soft:var(--color-surface)] [--toast-on-soft:var(--color-fg)] [--toast-solid:var(--color-fg)] [--toast-on-solid:var(--color-bg)] [--toast-strong:var(--color-border-strong)]',
      success:
        '[--toast-soft:var(--color-success-soft)] [--toast-on-soft:var(--color-on-success-soft)] [--toast-solid:var(--color-success)] [--toast-on-solid:var(--color-on-success)] [--toast-strong:var(--color-success)]',
      info: '[--toast-soft:var(--color-info-soft)] [--toast-on-soft:var(--color-on-info-soft)] [--toast-solid:var(--color-info)] [--toast-on-solid:var(--color-on-info)] [--toast-strong:var(--color-info)]',
      warning:
        '[--toast-soft:var(--color-warning-soft)] [--toast-on-soft:var(--color-on-warning-soft)] [--toast-solid:var(--color-warning)] [--toast-on-solid:var(--color-on-warning)] [--toast-strong:var(--color-warning)]',
      danger:
        '[--toast-soft:var(--color-danger-soft)] [--toast-on-soft:var(--color-on-danger-soft)] [--toast-solid:var(--color-danger)] [--toast-on-solid:var(--color-on-danger)] [--toast-strong:var(--color-danger)]',
    },
  },
});

export type ToastVariant = 'bar' | 'soft' | 'outline' | 'solid';

const toastVariants = cva(
  'flex items-start rounded-md border text-fg shadow-lg outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
  {
    variants: {
      variant: {
        // Today's look: a white card with a coloured bar on the start side.
        bar: 'border-border bg-bg',
        soft: 'border-transparent bg-(--toast-soft) text-(--toast-on-soft)',
        // Page background; the tone is the border (and the bar-less text stays fg).
        outline: 'border-(--toast-strong) bg-bg',
        solid: 'border-transparent bg-(--toast-solid) text-(--toast-on-solid)',
      },
      size: {
        sm: 'gap-2 p-2 text-xs',
        md: 'gap-3 p-3 text-sm',
      },
    },
  },
);

/** Said before the title, so the tone isn't carried by color alone (same as Alert). */
const toneWord: Record<ToastTone, string | null> = {
  neutral: null,
  success: 'Success',
  info: 'Information',
  warning: 'Warning',
  danger: 'Error',
};

export type ToastRegionProps = {
  /**
   * How every toast looks. Set once here, not per toast: the code that *sends* a toast
   * (an API call, a save handler) says what happened (`tone`), and the app shell
   * decides how it looks.
   * - `bar` (default): white card with a coloured bar.
   * - `soft`: tinted card. `outline`: coloured border. `solid`: strong fill.
   * @default 'bar'
   */
  variant?: ToastVariant;
  /** `sm`: tighter padding and smaller text, for dense apps. @default 'md' */
  size?: 'sm' | 'md';
  /** Classes for the region (e.g. a different corner). Default: bottom-right. */
  className?: string;
};

/**
 * Where toasts appear. Render it **once**, near the root of the app. It shows up only
 * while there are toasts.
 *
 * - It's a landmark region named after the count ("2 notifications"): F6 jumps into it
 *   from anywhere and back out; Tab moves between toasts and their buttons.
 * - Each toast is a non-modal `alertdialog` whose text is a `role="alert"`, so screen
 *   readers announce it as soon as it appears (React Aria reveals it one render
 *   after mounting, which NVDA needs to notice it).
 */
export function ToastRegion({
  variant = 'bar',
  size = 'md',
  className,
}: ToastRegionProps) {
  // On a coloured fill, grey text and the yellow link underline lose contrast, so the
  // parts follow the toast's own text colour instead.
  const onColour = variant === 'soft' || variant === 'solid';
  return (
    <AriaToastRegion
      queue={queue}
      className={cn(
        'fixed end-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col-reverse gap-2',
        // F6 focuses the region itself: show where focus went (WCAG 2.4.7).
        'rounded-lg outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-offset-4 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        className,
      )}
    >
      {({ toast: item }) => {
        const tone = item.content.tone ?? 'neutral';
        const word = toneWord[tone];
        return (
          <AriaToast
            toast={item}
            className={cn(
              toneColors({ tone }),
              toastVariants({ variant, size }),
            )}
          >
            {variant === 'bar' && (
              <span
                aria-hidden="true"
                className={cn(
                  'w-1 shrink-0 self-stretch rounded-full',
                  // Neutral has no strong colour of its own: use the strong border.
                  tone === 'neutral'
                    ? 'bg-border-strong'
                    : 'bg-(--toast-strong)',
                )}
              />
            )}
            <AriaToastContent className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Text slot="title" className="font-semibold">
                {word && <span className="sr-only">{word}: </span>}
                {item.content.title}
              </Text>
              {item.content.description && (
                <Text
                  slot="description"
                  className={onColour ? 'text-current' : 'text-fg-muted'}
                >
                  {item.content.description}
                </Text>
              )}
            </AriaToastContent>
            {item.content.action && (
              <ToastAction
                onColour={onColour}
                onPress={() => {
                  item.content.action?.onAction();
                  queue.close(item.key);
                }}
              >
                {item.content.action.label}
              </ToastAction>
            )}
            {/* slot="close": React Aria wires it to close this toast. */}
            <AriaButton
              slot="close"
              aria-label="Close"
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
                onColour
                  ? 'text-current hover:bg-current/10'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              <XIcon className="size-3.5" />
            </AriaButton>
          </AriaToast>
        );
      }}
    </AriaToastRegion>
  );
}

function ToastAction({
  onPress,
  onColour,
  children,
}: {
  onPress: () => void;
  onColour: boolean;
  children: ReactNode;
}) {
  return (
    <AriaButton
      onPress={onPress}
      className={cn(
        'shrink-0 rounded px-2 py-0.5 font-medium underline decoration-2 underline-offset-4 outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        onColour
          ? 'decoration-current hover:bg-current/10'
          : 'decoration-link-underline hover:bg-surface',
      )}
    >
      {children}
    </AriaButton>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      {...props}
    >
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </svg>
  );
}
