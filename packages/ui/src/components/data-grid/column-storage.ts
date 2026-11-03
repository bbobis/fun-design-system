import type { DataGridColumnState } from './column-state';

/**
 * Saving a user's column layout in the browser (`stateKey`). The version is part of
 * the key: if the shape ever changes incompatibly, bump it and old saves are ignored
 * instead of breaking the grid.
 */
const VERSION = 1;
export const storageKeyOf = (stateKey: string) =>
  `fds:data-grid:${stateKey}:v${VERSION}`;

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

/**
 * The saved layout, or `undefined` when there is none, it's damaged, or storage is
 * blocked (private mode, a strict browser policy). Never throws: a broken save must
 * not stop the grid from showing.
 */
export function loadColumnState(
  stateKey: string,
): DataGridColumnState | undefined {
  try {
    const raw = window.localStorage.getItem(storageKeyOf(stateKey));
    if (!raw) return undefined;
    // Stored text is outside our control (another tab, an old version, a user
    // editing it in DevTools): check the shape before trusting it.
    const v = JSON.parse(raw) as Partial<DataGridColumnState>;
    if (
      !isStringArray(v.order) ||
      !isStringArray(v.hidden) ||
      !isStringArray(v.pinned?.start) ||
      !isStringArray(v.pinned?.end)
    )
      return undefined;
    const widths =
      v.widths && typeof v.widths === 'object'
        ? Object.fromEntries(
            Object.entries(v.widths).filter(
              ([, w]) => typeof w === 'number' && Number.isFinite(w),
            ),
          )
        : undefined;
    return {
      order: v.order,
      hidden: v.hidden,
      pinned: { start: v.pinned.start, end: v.pinned.end },
      ...(widths && { widths }),
    };
  } catch {
    return undefined;
  }
}

/** Saves the layout; `null` forgets it (after "Reset columns"). Never throws. */
export function saveColumnState(
  stateKey: string,
  state: DataGridColumnState | null,
) {
  try {
    const key = storageKeyOf(stateKey);
    if (state) window.localStorage.setItem(key, JSON.stringify(state));
    else window.localStorage.removeItem(key);
  } catch {
    // Full or blocked storage: the layout just isn't remembered this time.
  }
}
