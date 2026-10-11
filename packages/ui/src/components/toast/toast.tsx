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

const toneBar = cva('w-1 shrink-0 self-stretch rounded-full', {
  variants: {
    tone: {
      neutral: 'bg-border-strong',
      success: 'bg-success',
      info: 'bg-info',
      warning: 'bg-warning',
      danger: 'bg-danger',
    },
  },
});

/** Said before the title, so the tone isn't carried by color alone (same as Alert). */
const toneWord: Record<ToastTone, string | null> = {
  neutral: null,
  success: 'Success',
  info: 'Information',
  warning: 'Warning',
  danger: 'Error',
};

export type ToastRegionProps = {
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
export function ToastRegion({ className }: ToastRegionProps) {
  return (
    <AriaToastRegion
      queue={queue}
      className={cn(
        'fixed end-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col-reverse gap-2 outline-hidden',
        className,
      )}
    >
      {({ toast: item }) => {
        const tone = item.content.tone ?? 'neutral';
        const word = toneWord[tone];
        return (
          <AriaToast
            toast={item}
            className="flex items-start gap-3 rounded-md border border-border bg-bg p-3 text-sm text-fg shadow-lg outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
          >
            <span aria-hidden="true" className={toneBar({ tone })} />
            <AriaToastContent className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Text slot="title" className="font-semibold">
                {word && <span className="sr-only">{word}: </span>}
                {item.content.title}
              </Text>
              {item.content.description && (
                <Text slot="description" className="text-fg-muted">
                  {item.content.description}
                </Text>
              )}
            </AriaToastContent>
            {item.content.action && (
              <ToastAction
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
              className="flex size-6 shrink-0 items-center justify-center rounded text-fg-muted outline-hidden hover:text-fg data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
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
  children,
}: {
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <AriaButton
      onPress={onPress}
      className="shrink-0 rounded px-2 py-0.5 font-medium underline decoration-link-underline decoration-2 underline-offset-4 outline-hidden hover:bg-surface data-focus-visible:outline-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring"
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
