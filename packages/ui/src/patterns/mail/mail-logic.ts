import type { Mail, FolderId } from './mail-data';

/** The messages a folder shows after the search and the "Unread only" filter. */
export function visibleMessages(
  all: readonly Mail[],
  folder: FolderId,
  query: string,
  unreadOnly: boolean,
): Mail[] {
  const q = query.trim().toLowerCase();
  return all.filter(
    (m) =>
      m.folder === folder &&
      (!unreadOnly || m.unread) &&
      (!q ||
        [m.from, m.subject, m.preview ?? ''].some((s) =>
          s.toLowerCase().includes(q),
        )),
  );
}

/** One page of `items` (1-based), and the "1–25 of 60" range text for it. */
export function pageOf<T>(items: readonly T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(page, 1), pageCount);
  const start = (current - 1) * size;
  const slice = items.slice(start, start + size);
  const range = items.length
    ? `${start + 1}–${start + slice.length} of ${items.length}`
    : '0 of 0';
  return { slice, page: current, pageCount, range };
}

/**
 * The select-all checkbox's state for the messages on screen: `all` → checked,
 * `some` → the dash (indeterminate), `none` → empty.
 */
export function selectAllState(
  pageIds: readonly string[],
  selected: readonly string[],
): 'all' | 'some' | 'none' {
  const on = pageIds.filter((id) => selected.includes(id)).length;
  if (on === 0) return 'none';
  return on === pageIds.length ? 'all' : 'some';
}

/** What the status line says after a bulk action ("3 conversations marked as read."). */
export function markedMessage(count: number, read: boolean) {
  const what = count === 1 ? '1 conversation' : `${count} conversations`;
  return `${what} marked as ${read ? 'read' : 'unread'}.`;
}

/** Unread count per folder, for the sidebar badges. */
export function unreadCounts(all: readonly Mail[]): Record<FolderId, number> {
  const counts: Record<FolderId, number> = {
    inbox: 0,
    sent: 0,
    drafts: 0,
    archive: 0,
  };
  for (const m of all) if (m.unread) counts[m.folder] += 1;
  return counts;
}
