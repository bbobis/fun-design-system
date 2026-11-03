import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { cn } from '../../utils/cn';
import { statusIcons, XIcon } from '../alert/status-icons';

export type AnnouncementTone =
  | 'neutral'
  | 'info'
  | 'warning'
  | 'danger'
  | 'inverse';

export type AnnouncementBarProps = {
  /** The message: one or two short sentences. */
  children: ReactNode;
  /** @default 'info' */
  tone?: AnnouncementTone;
  /** One link or button after the message ("Status page", "Upgrade"). */
  action?: ReactNode;
  /**
   * Makes it dismissible and remembers that in `localStorage` under this key, so it
   * stays gone after a reload. Use a new key for a new message
   * ("maintenance-2026-11-08"), or nobody who dismissed the last one will see it.
   */
  dismissKey?: string;
  /** Called after it's dismissed (to tell the server, for example). */
  onDismiss?: () => void;
  /**
   * Where focus goes after dismissing. Default: the next focusable element after the
   * bar, so keyboard users carry on where they were instead of starting from the top.
   */
  returnFocus?: RefObject<HTMLElement | null>;
  /** Names the landmark. @default 'Announcement' */
  'aria-label'?: string;
  /** Show the tone's icon. @default true */
  icon?: boolean;
  className?: string;
};

const toneClass: Record<AnnouncementTone, string> = {
  neutral: 'bg-surface text-fg border-border',
  info: 'bg-info-soft text-on-info-soft border-info/30',
  warning: 'bg-warning-soft text-on-warning-soft border-warning/40',
  danger: 'bg-danger-soft text-on-danger-soft border-danger/30',
  // data-inverse flips the theme tokens inside: bg-bg / text-fg become the opposite.
  inverse: 'bg-bg text-fg border-transparent',
};

const storageKey = (key: string) => `fds:announcement-dismissed:${key}`;

/**
 * localStorage can throw (private mode, blocked storage, a sandboxed iframe), so every
 * read and write is wrapped: failing to remember is better than failing to render.
 */
function wasDismissed(key?: string): boolean {
  if (!key) return false;
  try {
    return window.localStorage.getItem(storageKey(key)) === '1';
  } catch {
    return false;
  }
}
function rememberDismissed(key: string) {
  try {
    window.localStorage.setItem(storageKey(key), '1');
  } catch {
    // Not remembered: it comes back after a reload. Acceptable.
  }
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Can it take focus right now? A `display: none` element (AppShell's ☰ button on wide
 * screens) matches the selector but ignores `.focus()`. `checkVisibility()` knows;
 * where it's missing (older browsers, jsdom) we assume visible.
 */
const isVisible = (el: HTMLElement) =>
  typeof el.checkVisibility === 'function' ? el.checkVisibility() : true;

/** The first visible focusable element after `el` in the page, in DOM (tab) order. */
function nextFocusable(el: HTMLElement): HTMLElement | null {
  for (const candidate of document.querySelectorAll<HTMLElement>(FOCUSABLE)) {
    const after =
      el.compareDocumentPosition(candidate) & Node.DOCUMENT_POSITION_FOLLOWING;
    if (after && !el.contains(candidate) && isVisible(candidate))
      return candidate;
  }
  return null;
}

/**
 * A thin bar across the top of the app for a message that applies everywhere:
 * maintenance, a trial ending, a new feature. Put it in AppShell's `announcement`
 * slot. (For a message about one page or one card, use `<Alert banner>`.)
 *
 * It's a landmark (`<section aria-label="Announcement">`) that screen readers can
 * jump to, not a live region: it's there when the page loads, so it shouldn't
 * interrupt. With `dismissKey`, a × hides it and the choice is remembered.
 */
export function AnnouncementBar({
  children,
  tone = 'info',
  action,
  dismissKey,
  onDismiss,
  returnFocus,
  'aria-label': ariaLabel = 'Announcement',
  icon = true,
  className,
}: AnnouncementBarProps) {
  const [dismissed, setDismissed] = useState(() => wasDismissed(dismissKey));
  const barRef = useRef<HTMLElement>(null);
  // Picked while the bar is still in the page (after removal, "next" means nothing).
  const focusAfter = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (dismissed) focusAfter.current?.focus();
  }, [dismissed]);

  if (dismissed) return null;

  const dismiss = () => {
    focusAfter.current =
      returnFocus?.current ??
      (barRef.current ? nextFocusable(barRef.current) : null);
    if (dismissKey) rememberDismissed(dismissKey);
    setDismissed(true);
    onDismiss?.();
  };

  const Icon = statusIcons[tone === 'inverse' ? 'neutral' : tone];
  const canDismiss = dismissKey !== undefined || onDismiss !== undefined;

  return (
    <section
      ref={barRef}
      aria-label={ariaLabel}
      data-inverse={tone === 'inverse' || undefined}
      className={cn(
        'flex items-center gap-3 border-b px-3 py-2 text-sm lg:px-4',
        toneClass[tone],
        className,
      )}
    >
      {/* Centred message; the × stays at the end. */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        {icon && <Icon className="size-4 shrink-0" />}
        <p className="min-w-0">{children}</p>
        {action && <div className="shrink-0 font-medium">{action}</div>}
      </div>
      {canDismiss && (
        <button
          type="button"
          aria-label="Dismiss announcement"
          onClick={dismiss}
          className="flex size-7 shrink-0 items-center justify-center rounded opacity-80 hover:bg-current/10 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-focus-ring"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
    </section>
  );
}
