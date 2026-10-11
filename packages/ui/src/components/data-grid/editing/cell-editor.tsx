import { useLayoutEffect, useRef, type RefObject } from 'react';
import { cn } from '../../../utils/cn';
import { isIsoDate } from '../../date-picker/iso-date';
import type {
  DataGridEditorKind,
  DataGridSearchOptions,
} from '../data-grid-features';
import type { CellEditorHandle, EditorCommit } from './popover-editor';
import { ComboboxCellEditor, DateCellEditor } from './popover-editors';

export type { CellEditorHandle, EditorCommit } from './popover-editor';

type CellEditorProps = {
  kind: DataGridEditorKind;
  /** Accessible name, usually the column header ("Customer"). */
  label: string;
  /**
   * Starting text. Native editors: the current value (Enter/F2) or the typed character
   * (type-to-replace). Popover editors: always the current value (see `seed`).
   */
  initialValue: string;
  /** Popover editors: the key that started the edit, if any (the combobox searches it). */
  seed?: string;
  options?: readonly string[];
  searchOptions?: DataGridSearchOptions;
  align?: 'start' | 'end';
  /** The editor fills this in; the grid reads the value from it when it commits. */
  editorRef: RefObject<CellEditorHandle | null>;
  /** Popover editors handle Enter / Tab / Escape themselves and report them here. */
  onCommit: (action: EditorCommit) => boolean | void;
  /** Focus left the editor (a click elsewhere): commit in place, like Excel. */
  onLeave: () => void;
};

/**
 * The one boxed input in edit mode. Native editors (text, number, select) are
 * uncontrolled on purpose: the grid only needs the value at commit time, so typing
 * doesn't re-render the 10k-row table on every key. Popover editors (combobox, date)
 * are React Aria components behind the same handle.
 */
export function CellEditor(props: CellEditorProps) {
  const { kind, seed, options, searchOptions, ...shared } = props;
  if (kind === 'combobox')
    return (
      <ComboboxCellEditor
        {...shared}
        seed={seed}
        options={options}
        searchOptions={searchOptions}
      />
    );
  if (kind === 'date') return <DateCellEditor {...shared} />;
  return <NativeCellEditor {...props} />;
}

function NativeCellEditor({
  kind,
  label,
  initialValue,
  options = [],
  align = 'start',
  editorRef,
  onLeave,
}: CellEditorProps) {
  const local = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

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
    // The handle: native editors' value *is* the DOM value.
    editorRef.current = {
      getValue: () => el.value,
      focus: () => el.focus(),
    };
    return () => {
      editorRef.current = null;
    };
  }, [editorRef]);

  const onBlur = (event: { currentTarget: Element }) => {
    // Moving focus with our own keys has already committed and unmounted the editor.
    if (event.currentTarget.isConnected) onLeave();
  };

  const className = cn(
    'h-full w-full min-w-0 rounded-none border-0 bg-bg px-3 text-sm text-fg',
    'outline-2 -outline-offset-2 outline-primary',
    align === 'end' && 'text-end tabular-nums',
  );

  if (kind === 'select') {
    return (
      <select
        ref={(el) => {
          local.current = el;
        }}
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
      ref={(el) => {
        local.current = el;
      }}
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
 * Turns typed or pasted text into the column's value. Returns `{ ok: false }` when the
 * text can't be a value of that type, so the grid can keep the editor open (typing) or
 * reject the cell (paste).
 */
export function parseEditorValue(
  kind: DataGridEditorKind,
  raw: string,
  options: readonly string[] = [],
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (kind === 'date') {
    const text = raw.trim();
    if (text === '') return { ok: true, value: null };
    // Only 'YYYY-MM-DD': '3/10/2026' is March 10 or October 3 depending on who typed it.
    return isIsoDate(text)
      ? { ok: true, value: text }
      : { ok: false, message: 'Use a date like 2026-10-04' };
  }
  // A combobox with server search has no list to check against: keep the text.
  if (kind === 'combobox' && options.length === 0) {
    const text = raw.trim();
    return { ok: true, value: text === '' ? null : text };
  }
  if (kind === 'select' || kind === 'combobox') {
    if (raw === '') return { ok: true, value: null };
    // Pasted text is often a different case ("pending"): match it to the real option.
    const match =
      options.find((o) => o === raw) ??
      options.find((o) => o.toLowerCase() === raw.trim().toLowerCase());
    return match === undefined
      ? { ok: false, message: 'Not one of the choices' }
      : { ok: true, value: match };
  }
  if (kind === 'checkbox') {
    // What people paste from Excel and Sheets: TRUE/FALSE, yes/no, 1/0, x.
    const v = raw.trim().toLowerCase();
    if (['true', 'yes', 'y', '1', 'x', '✓'].includes(v))
      return { ok: true, value: true };
    if (['false', 'no', 'n', '0', ''].includes(v))
      return { ok: true, value: false };
    return { ok: false, message: 'Use yes or no' };
  }
  if (kind !== 'number') return { ok: true, value: raw };
  // Excel copies what it displays: "$1,234.50". Strip the formatting before parsing.
  const cleaned = raw.replace(/[\s,$]/g, '');
  if (cleaned === '') return { ok: true, value: null };
  const n = Number(cleaned);
  return Number.isFinite(n)
    ? { ok: true, value: n }
    : { ok: false, message: 'Enter a number' };
}
