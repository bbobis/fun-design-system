import {
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type RefObject,
} from 'react';
import { cn } from '../../../utils/cn';
import type { DataGridEditorKind } from '../data-grid-features';

export type CellEditorElement = HTMLInputElement | HTMLSelectElement;

type CellEditorProps = {
  kind: DataGridEditorKind;
  /** Accessible name, usually the column header ("Customer"). */
  label: string;
  /** Starting text: the current value (Enter/F2) or the typed character (type-to-replace). */
  initialValue: string;
  options?: readonly string[];
  align?: 'start' | 'end';
  /** The grid reads the value from here when it commits. */
  editorRef: RefObject<CellEditorElement | null>;
  /** Clicking elsewhere commits, like Excel. */
  onBlur: (event: FocusEvent<CellEditorElement>) => void;
};

/**
 * The one boxed input in edit mode. Uncontrolled on purpose: the grid only needs the
 * value at commit time, so typing doesn't re-render the 10k-row table on every key.
 */
export function CellEditor({
  kind,
  label,
  initialValue,
  options = [],
  align = 'start',
  editorRef,
  onBlur,
}: CellEditorProps) {
  const local = useRef<CellEditorElement | null>(null);

  // Focus on mount and put the caret at the end. Without this, type-to-replace
  // ("A" then "cme") ends up as "cmeA": the caret starts before the seeded letter.
  useLayoutEffect(() => {
    const el = local.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (el instanceof HTMLInputElement) {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    }
  }, []);

  const setRef = (el: CellEditorElement | null) => {
    local.current = el;
    editorRef.current = el;
  };

  const className = cn(
    'h-full w-full min-w-0 rounded-none border-0 bg-bg px-3 text-sm text-fg',
    'outline-2 -outline-offset-2 outline-primary',
    align === 'end' && 'text-end tabular-nums',
  );

  if (kind === 'select') {
    return (
      <select
        ref={setRef}
        aria-label={label}
        defaultValue={initialValue}
        onBlur={onBlur}
        className={className}
      >
        {!options.includes(initialValue) && (
          <option value={initialValue}>{initialValue}</option>
        )}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={setRef}
      aria-label={label}
      defaultValue={initialValue}
      onBlur={onBlur}
      inputMode={kind === 'number' ? 'decimal' : undefined}
      autoComplete="off"
      spellCheck={false}
      className={className}
    />
  );
}

/**
 * Turns editor text into the column's value. Returns `{ ok: false }` when the text
 * can't be a value of that type, so the grid can keep the editor open.
 */
export function parseEditorValue(
  kind: DataGridEditorKind,
  raw: string,
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (kind !== 'number') return { ok: true, value: raw };
  const cleaned = raw.replace(/[\s,$]/g, '');
  if (cleaned === '') return { ok: true, value: null };
  const n = Number(cleaned);
  return Number.isFinite(n)
    ? { ok: true, value: n }
    : { ok: false, message: 'Enter a number' };
}
