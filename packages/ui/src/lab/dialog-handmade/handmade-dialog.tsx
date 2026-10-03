/**
 * LAB: a modal dialog built by hand, with no headless library.
 *
 * This is a learning exercise for Phase 4. It is NOT exported from the package.
 * Every numbered block below is a job a headless library does for us; count them.
 * See the "Not handled" list at the bottom for what this version still gets wrong.
 */
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Heading } from '../../components/heading';
import { Text } from '../../components/text';

/** Elements a keyboard user can Tab to. Hand-maintained, which is part of the problem. */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export type HandmadeDialogProps = {
  /** Whether the dialog is shown. The app owns this state. */
  open: boolean;
  /** Called with `false` when the user asks to close (Esc, backdrop click). */
  onOpenChange: (open: boolean) => void;
  /** Becomes the dialog's accessible name via aria-labelledby. */
  title: ReactNode;
  /** Read after the title via aria-describedby. */
  description?: ReactNode;
  children?: ReactNode;
};

export function HandmadeDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: HandmadeDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    // ① Remember what had focus (usually the button that opened us), so we can go back.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // ② Move focus into the dialog. Without this, focus stays on the page behind it.
    const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE);
    (firstFocusable ?? panel).focus();

    // ③ Lock page scroll, so the wheel and touch don't scroll the page behind.
    const body = document.body;
    const hadScrollLock = body.classList.contains('overflow-hidden');
    body.classList.add('overflow-hidden');

    // ④ Make everything outside the dialog inert: not clickable, not focusable, and
    //    hidden from screen readers. `aria-modal` alone is only a hint some readers ignore.
    const dialogRoot = panel.closest('[data-dialog-root]');
    const outside = Array.from(body.children).filter(
      (el) => el !== dialogRoot && !el.hasAttribute('inert'),
    );
    outside.forEach((el) => el.setAttribute('inert', ''));

    return () => {
      // Undo in reverse order. inert must go first, or the trigger can't take focus back.
      outside.forEach((el) => el.removeAttribute('inert'));
      if (!hadScrollLock) body.classList.remove('overflow-hidden');
      // ⑤ Return focus to where the user was.
      previouslyFocused?.focus();
    };
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // ⑥ Esc closes.
    if (event.key === 'Escape') {
      event.stopPropagation();
      onOpenChange(false);
      return;
    }

    // ⑦ Trap Tab: wrap from the last element to the first, and Shift+Tab the other way.
    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;

  // ⑧ Portal: render at the end of <body>, outside any parent's overflow or z-index.
  return createPortal(
    <div
      data-dialog-root
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* ⑨ Backdrop. Click closes. Keyboard users have Esc, so this stays mouse-only. */}
      <div
        aria-hidden="true"
        data-testid="dialog-backdrop"
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
      />
      {/* ⑩ The ARIA contract: role, modal, name, description. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="relative flex w-full max-w-md flex-col gap-2 rounded-lg border border-border bg-bg p-6 text-fg shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <Heading level={2} size="lg" id={titleId}>
          {title}
        </Heading>
        {description && (
          <Text id={descriptionId} tone="muted" size="sm">
            {description}
          </Text>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/*
 * Not handled (a library handles these; we'd have to add each one):
 * - Nested dialogs: closing an inner one removes inert from the outer dialog too.
 * - Scrollbar jump: hiding overflow removes the scrollbar, and the page shifts sideways.
 * - iOS Safari: overflow:hidden on <body> doesn't stop touch scrolling.
 * - Exit animations: we unmount instantly, so there's nothing to animate out.
 * - Focus target choice: a "Delete?" dialog should focus Cancel, not the first button.
 * - The FOCUSABLE list misses contenteditable, <details>, <audio controls>, iframes…
 * - Content that changes while open (a field becomes disabled) isn't re-checked.
 * - Two dialogs mounting at once both try to own focus and inert.
 */
