import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cn } from '../../utils/cn';
import { SpinnerIcon } from '../combobox/combobox-parts';
import { Input } from '../input';

export type InlineEditSize = 'sm' | 'md' | 'lg';

export type InlineEditProps = {
  /**
   * What the value is ("Invoice title"). Names the input, and finishes the edit
   * button's name: "Q4 retainer, edit Invoice title".
   */
  label: string;
  /** The current value (controlled: update it in `onSave`). */
  value: string;
  /**
   * Called with the new text when the user saves (only if it changed). Return a
   * Promise to show a spinner while it runs; if it rejects, its `message` is shown
   * and the user keeps editing, with their text kept.
   */
  onSave: (next: string) => void | Promise<void>;
  /** Return an error message to block saving ("Enter a title."), or `undefined`. */
  validate?: (next: string) => string | undefined;
  /** Shown (grey) when the value is empty. @default 'Empty' */
  placeholder?: string;
  /**
   * What clicking or tabbing away does while editing. `save` (default) keeps what
   * was typed; `cancel` throws it away.
   * @default 'save'
   */
  blurBehavior?: 'save' | 'cancel';
  /** Text size, to match what's around it. @default 'md' */
  size?: InlineEditSize;
  /** Can't be edited: shown as plain text. @default false */
  disabled?: boolean;
  /** Classes for the outer wrapper (width). */
  className?: string;
};

const textSize: Record<InlineEditSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-semibold',
};

const messageOf = (e: unknown) =>
  e instanceof Error && e.message ? e.message : 'Couldn’t save. Try again.';

/**
 * Text you can edit in place: click it (or Tab to it and press Enter) and it turns
 * into an input. Enter or ✓ saves, Escape or ✕ cancels; either way focus comes back
 * to the text. For a renamed invoice, a project name, a table cell's note.
 *
 * Reading mode is a real `<button>`, named "<value>, edit <label>": it starts with
 * the visible text (WCAG 2.5.3), so "click Q4 retainer" works by voice too.
 */
export function InlineEdit({
  label,
  value,
  onSave,
  validate,
  placeholder = 'Empty',
  blurBehavior = 'save',
  size = 'md',
  disabled = false,
  className,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Give focus back to the text button after the edit ends, but only when the user
  // ended it from inside (Enter, Escape, ✓, ✕). If they clicked somewhere else,
  // focus is already where they wanted it: don't pull it back.
  const restoreFocus = useRef(false);
  const errorId = useId();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (restoreFocus.current) {
      restoreFocus.current = false;
      buttonRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setError(undefined);
    setEditing(true);
  };

  const cancel = (refocus: boolean) => {
    restoreFocus.current = refocus;
    setError(undefined);
    setEditing(false);
  };

  const save = async (refocus: boolean) => {
    if (pending) return;
    const next = draft.trim();
    if (next === value) return cancel(refocus); // nothing changed
    const problem = validate?.(next);
    if (problem) {
      setError(problem);
      // Clicked away with an invalid value: stay in editing so the error is seen.
      inputRef.current?.focus();
      return;
    }
    setPending(true);
    try {
      await onSave(next);
      restoreFocus.current = refocus;
      setError(undefined);
      setEditing(false);
    } catch (e) {
      setError(messageOf(e));
      inputRef.current?.focus();
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void save(true);
    } else if (e.key === 'Escape') {
      // Stop it here: an Escape that also closes the Dialog around us would be a surprise.
      e.stopPropagation();
      cancel(true);
    }
  };

  /**
   * Focus left the editor. `relatedTarget` is where it's going: if that's our own
   * ✓ / ✕, the button's click will handle it, so do nothing here.
   */
  const onBlur = (e: FocusEvent<HTMLSpanElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (pending) return;
    if (blurBehavior === 'cancel') cancel(false);
    else void save(false);
  };

  if (!editing) {
    const empty = value.trim() === '';
    if (disabled) {
      return (
        <span
          className={cn(textSize[size], empty && 'text-fg-muted', className)}
        >
          {empty ? placeholder : value}
        </span>
      );
    }
    return (
      <button
        ref={buttonRef}
        type="button"
        onClick={start}
        className={cn(
          'group -mx-1 inline-flex max-w-full items-center gap-1.5 rounded px-1 text-start text-fg',
          'hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus-ring',
          textSize[size],
          className,
        )}
      >
        {/* Wraps instead of truncating: a cut-off title hides what you'd edit, and
            truncate's zero min-width let flex parents squeeze it to a few letters. */}
        <span className={cn('min-w-0 break-words', empty && 'text-fg-muted')}>
          {empty ? placeholder : value}
        </span>
        {/* Leading comma: a leading space is trimmed from the accessible name. */}
        <span className="sr-only">, edit {label}</span>
        <PencilIcon className="size-3.5 shrink-0 text-fg-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </button>
    );
  }

  // Spans, not divs/p: a heading (or a button's parent) may only hold "phrasing"
  // content, and InlineEdit often lives inside an <h1>. Input and button are phrasing.
  return (
    <span className={cn('flex flex-col gap-1', className)}>
      <span onBlur={onBlur} className="flex items-center gap-1">
        <Input
          ref={inputRef}
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          readOnly={pending}
          aria-busy={pending || undefined}
          invalid={error !== undefined}
          aria-describedby={error ? errorId : undefined}
          // Same size names as Input, so the box height follows the text size.
          size={size}
          className={cn('flex-1', textSize[size])}
        />
        <EditButton
          label="Save"
          disabled={pending}
          // mousedown would move focus (and fire blur) before click. Keeping focus in
          // the input means no blur at all, which also covers Safari, where buttons
          // don't take focus on click (so relatedTarget would be null).
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void save(true)}
        >
          {/* The spinner lives here, not as an Input adornment: adding one would
              rebuild the <input> (losing focus mid-save) and wrap it in a <div>. */}
          {pending ? (
            <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <CheckIcon className="size-4" />
          )}
        </EditButton>
        <EditButton
          label="Cancel"
          disabled={pending}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => cancel(true)}
        >
          <XIcon className="size-4" />
        </EditButton>
      </span>
      {error && (
        <span id={errorId} className="text-sm font-normal text-fg-danger">
          {error}
        </span>
      )}
    </span>
  );
}

function EditButton({
  label,
  children,
  ...rest
}: {
  label: string;
  children: ReactNode;
  disabled?: boolean;
  onMouseDown: (e: MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      {...rest}
      className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-bg text-fg-muted hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-solid focus-visible:outline-focus-ring disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}
const PencilIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={1.5}>
    <path d="M10.5 2.5l3 3L5 14H2v-3z" />
    <path d="M9 4l3 3" />
  </Svg>
);
const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Svg>
);
const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="m4.5 4.5 7 7m0-7-7 7" />
  </Svg>
);
