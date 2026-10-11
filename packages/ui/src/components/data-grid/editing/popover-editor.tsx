import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { getGridKeyAction } from './keyboard';

/** What an editor asks the grid to do: keep the value and move, or throw the edit away. */
export type EditorCommit =
  | { type: 'commit'; dRow: number; dCol: number }
  | { type: 'cancel' };

/**
 * The editor contract. Every cell editor (native or popover) fills in this handle, and
 * the grid reads the value from it at commit time, never from an input's DOM text.
 * That matters for a combobox: its input holds the *search text* ("sof"), while its
 * value is the picked option ("Software").
 */
export type CellEditorHandle = {
  /** The value to commit, as text the column's parser understands ('' = empty). */
  getValue: () => string;
  /** Put focus back in the editor (after a rejected value). */
  focus: () => void;
};

/** The editing keys (Enter, Tab, Escape) as an EditorCommit, or null for any other key. */
function toCommit(e: KeyboardEvent): EditorCommit | null {
  const action = getGridKeyAction(
    {
      key: e.key,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      isComposing: e.nativeEvent.isComposing,
    },
    // Editing mode: the keymap only cares about the key, not about where we are.
    {
      editing: true,
      row: 0,
      col: 0,
      endRow: 0,
      endCol: 0,
      rowCount: 1,
      colCount: 1,
    },
  );
  if (action.type === 'commit') return action;
  if (action.type === 'cancel') return action;
  return null;
}

const STAY: EditorCommit = { type: 'commit', dRow: 0, dCol: 0 };

type PopoverEditorShellProps = {
  /**
   * Is the editor's popup (list, calendar) open right now? A ref, not state: key
   * handlers must see the value the library set a moment ago in the same keystroke.
   */
  openRef: { readonly current: boolean };
  /** Ask the grid to commit or cancel. Return false if the value was rejected. */
  onCommit: (action: EditorCommit) => boolean | void;
  /** Focus left the editor and its popup for good (a click elsewhere). Commits in place. */
  onLeave: () => void;
  /** Gets `picked`: call it when the user chose a value in the popup (click, Enter). */
  children: (picked: () => void) => ReactNode;
};

/**
 * Wraps a popover cell editor (combobox, date) and routes the grid's three keys.
 *
 * - **Popup closed:** Enter / Tab / Escape belong to the grid. We catch them in the
 *   *capture* phase, before React Aria sees them (it stops Enter from bubbling), and
 *   commit or cancel directly.
 * - **Popup open:** the library owns the keys (Enter picks, Escape closes the list).
 *   We only stop them from also reaching the grid's handler, and remember which way
 *   to move, so a pick made with Enter commits *and* moves down, like a native select.
 *
 * Library-agnostic on purpose: it only needs "is the popup open" and "a value was
 * picked", so the date editor and any future popover editor reuse it unchanged.
 */
export function PopoverEditorShell({
  openRef,
  onCommit,
  onLeave,
  children,
}: PopoverEditorShellProps) {
  // Which way the last Enter/Tab asked to move; used when the library then picks a value.
  const pending = useRef<EditorCommit | null>(null);
  const done = useRef(false);
  const inside = useRef(true);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const finish = (action: EditorCommit) => {
    if (done.current) return;
    // A rejected value keeps the editor open, so it can be finished again later.
    if (onCommit(action) !== false) done.current = true;
  };

  const picked = () => {
    const move = pending.current;
    pending.current = null;
    finish(move?.type === 'commit' ? move : STAY);
  };

  return (
    <div
      className="contents"
      onKeyDownCapture={(e) => {
        const action = toCommit(e);
        pending.current = action;
        if (!action || openRef.current) return; // open: the library owns the key
        e.preventDefault();
        e.stopPropagation(); // React Aria never sees it…
        finish(action); // …and the grid gets it directly
      }}
      onKeyDown={(e) => {
        // Bubble phase, after the library. Never let these keys reach the grid's own
        // handler too: it would commit (or cancel) a second time.
        const action = toCommit(e);
        if (!action) return;
        e.stopPropagation();
        // Tab with the list open: React Aria picked the highlighted option and closed
        // the list (or nothing changed). Either way, now commit and move.
        if (e.key === 'Tab' && !openRef.current) {
          e.preventDefault();
          finish(action);
        }
      }}
      // A click inside the popup is a pick, not a keystroke: forget the last key's move.
      onPointerDownCapture={() => {
        pending.current = null;
      }}
      // React focus events bubble through portals (the React tree, not the DOM), so
      // moving focus into the calendar popup still counts as "inside".
      onFocus={() => {
        inside.current = true;
      }}
      onBlur={() => {
        inside.current = false;
        // Focus moves in two steps (blur here, focus there). Wait for the second.
        setTimeout(() => {
          if (mounted.current && !inside.current && !done.current) {
            done.current = true;
            onLeave();
          }
        }, 0);
      }}
    >
      {children(picked)}
    </div>
  );
}
