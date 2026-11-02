import type { ReactNode } from 'react';
import {
  Checkbox as AriaCheckbox,
  GridList,
  GridListItem,
  type Selection,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { CheckboxBox } from '../checkbox-group/checkbox-group';

/** One message (or conversation) in the list. Extend it with your own fields. */
export type MessageItem = {
  /** Stable and unique. What selection, `openId` and `onOpen` use. */
  id: string;
  /** Who sent it ("Ana Ruiz"). */
  from: string;
  /** The subject line. */
  subject: string;
  /** A short start of the body, shown after the subject. Not read out with the row. */
  preview?: string;
  /** The date as people should read it ("Oct 29", "9:41 AM"). */
  date: string;
  /** The same date, machine-readable (ISO 8601), for the `<time>` element. */
  dateTime?: string;
  /** Not read yet: bold, with a dot, and "unread" in the row's name. */
  unread?: boolean;
};

export type MessageListProps<T extends MessageItem> = {
  /** Names the list ("Inbox"). Required: there's no visible heading inside. */
  'aria-label': string;
  /** The messages, newest first (the list doesn't sort). */
  messages: readonly T[];
  /** The checked ids (controlled). Pair with `onSelectionChange`. */
  selected: readonly string[];
  /** Called with every checked id, in list order, after any change. */
  onSelectionChange: (ids: string[]) => void;
  /** The message shown in the reading pane, highlighted in the list. */
  openId?: string;
  /**
   * Open a message: Enter on a row, or a click anywhere but its checkbox, **while
   * nothing is ticked**. Once something is ticked, a click ticks the row and Enter
   * waits (see the component docs); Escape clears the ticks.
   */
  onOpen?: (id: string) => void;
  /**
   * `comfortable`: sender and date on the first line, subject + preview below.
   * `compact`: one line per message, for long lists. @default 'comfortable'
   */
  density?: 'comfortable' | 'compact';
  /** Shown when `messages` is empty. @default 'No messages' */
  emptyState?: ReactNode;
  className?: string;
};

/**
 * The ids `selectBy` checks for a "Select ▾" menu: everything, nothing, or only the
 * read or unread messages. Pure, so it's tested on its own.
 */
export function selectBy(
  messages: readonly MessageItem[],
  which: 'all' | 'none' | 'read' | 'unread',
): string[] {
  if (which === 'none') return [];
  return messages
    .filter((m) =>
      which === 'all' ? true : which === 'unread' ? m.unread : !m.unread,
    )
    .map((m) => m.id);
}

/** A copy of `messages` with `ids` marked read (or unread). Others are untouched. */
export function markRead<T extends MessageItem>(
  messages: readonly T[],
  ids: readonly string[],
  read: boolean,
): T[] {
  const set = new Set(ids);
  return messages.map((m) => (set.has(m.id) ? { ...m, unread: !read } : m));
}

/**
 * The row's accessible name. React Aria names a row from `textValue` alone, so it
 * holds what a screen reader should say: sender, subject, date, then "unread".
 * "Unread" goes *last*: typing a letter jumps to the row whose name starts with it,
 * and people type the sender's initial, not "U".
 */
export const messageName = (m: MessageItem) =>
  [m.from, m.subject, m.date, m.unread && 'unread'].filter(Boolean).join(', ');

/**
 * A mailbox-style list: a checkbox per row, unread messages in bold with a dot.
 * Built on React Aria `GridList` with checkboxes (`selectionBehavior="toggle"`).
 *
 * Keyboard: ↑/↓ move between rows (Home/End, Page Up/Down too), **Space** ticks the
 * row's checkbox, **Enter** opens the message (`onOpen`), Ctrl/⌘+A ticks all,
 * Escape clears the ticks, typing a letter jumps to the next sender starting with it.
 * With the mouse, the checkbox ticks and the rest of the row opens.
 *
 * Selection mode: once any row is ticked, a click on a row ticks it too and Enter
 * waits (React Aria's checkbox-list behavior, like phone mail apps), so a stray
 * click mid-selection adds to it instead of leaving it. Escape (or "Select none")
 * ends it, and opening works again.
 *
 * Bulk actions (mark read, archive) live outside, in a toolbar that reads
 * `selected`. Helpers: `selectBy` for a "Select ▾" menu, `markRead` for the data.
 *
 * @example
 * <MessageList aria-label="Inbox" messages={messages}
 *   selected={selected} onSelectionChange={setSelected}
 *   openId={openId} onOpen={(id) => { setOpenId(id); setMessages(markRead(messages, [id], true)); }} />
 */
export function MessageList<T extends MessageItem>({
  'aria-label': ariaLabel,
  messages,
  selected,
  onSelectionChange,
  openId,
  onOpen,
  density = 'comfortable',
  emptyState = 'No messages',
  className,
}: MessageListProps<T>) {
  const compact = density === 'compact';
  const toIds = (keys: Selection) =>
    keys === 'all'
      ? messages.map((m) => m.id)
      : // List order, not the order they were checked in.
        messages.map((m) => m.id).filter((id) => keys.has(id));

  return (
    <GridList
      aria-label={ariaLabel}
      items={messages}
      selectionMode="multiple"
      // Checkboxes: clicking or Space adds to the selection instead of replacing it.
      // With onAction, a click on the row (not the checkbox) and Enter open it.
      selectionBehavior="toggle"
      selectedKeys={selected}
      onSelectionChange={(keys) => onSelectionChange(toIds(keys))}
      onAction={onOpen && ((key) => onOpen(String(key)))}
      renderEmptyState={() => (
        <p className="px-4 py-10 text-center text-sm text-fg-muted">
          {emptyState}
        </p>
      )}
      className={cn(
        'flex flex-col divide-y divide-border overflow-auto bg-bg text-sm outline-hidden',
        // The list itself takes focus only when it's empty.
        'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
        className,
      )}
    >
      {(m) => (
        <GridListItem
          id={m.id}
          textValue={messageName(m)}
          data-unread={m.unread || undefined}
          data-open={m.id === openId || undefined}
          className={cn(
            'group relative flex cursor-pointer gap-3 px-3 outline-hidden',
            compact ? 'items-center py-1.5' : 'items-start py-2.5',
            m.unread ? 'bg-bg' : 'bg-surface/40',
            'hover:bg-surface',
            'data-selected:bg-primary/10',
            // The open message: a bar on the start edge, and a stronger fill.
            m.id === openId &&
              'bg-surface before:absolute before:inset-y-0 before:start-0 before:w-1 before:bg-primary',
            // Inside the row, so the scrolling list can't clip it (recipe rule 26).
            'data-focus-visible:outline-2 data-focus-visible:-outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
          )}
        >
          {/* slot="selection": React Aria wires this checkbox to the row. It's not a
              Tab stop; Space on the row does the same. */}
          <AriaCheckbox
            slot="selection"
            className={cn('flex cursor-pointer', !compact && 'pt-0.5')}
          >
            <CheckboxBox />
          </AriaCheckbox>
          {/* The dot: decorative (the name says "unread"). Always takes its space,
              so read and unread rows line up. */}
          <span
            aria-hidden="true"
            className={cn(
              'size-2 shrink-0 rounded-full',
              compact ? '' : 'mt-1.5',
              m.unread ? 'bg-primary' : 'bg-transparent',
            )}
          />
          {compact ? (
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={cn(
                  'w-40 shrink-0 truncate',
                  m.unread ? 'font-semibold text-fg' : 'text-fg',
                )}
              >
                {m.from}
              </span>
              <span className="min-w-0 flex-1 truncate text-fg-muted">
                <span className={cn('text-fg', m.unread && 'font-semibold')}>
                  {m.subject}
                </span>
                {m.preview && <> — {m.preview}</>}
              </span>
            </span>
          ) : (
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span
                className={cn('truncate text-fg', m.unread && 'font-semibold')}
              >
                {m.from}
              </span>
              <span className="truncate text-fg-muted">
                <span className={cn('text-fg', m.unread && 'font-semibold')}>
                  {m.subject}
                </span>
                {m.preview && <> — {m.preview}</>}
              </span>
            </span>
          )}
          <time
            dateTime={m.dateTime}
            className={cn(
              'shrink-0 text-xs tabular-nums',
              compact ? '' : 'pt-0.5',
              m.unread ? 'font-semibold text-fg' : 'text-fg-muted',
            )}
          >
            {m.date}
          </time>
        </GridListItem>
      )}
    </GridList>
  );
}
