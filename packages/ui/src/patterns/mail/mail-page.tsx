import { useMemo, useRef, useState, type SVGProps } from 'react';
import {
  AppShell,
  SideNav,
  SideNavItem,
  SideNavSection,
} from '../../components/app-shell';
import { Badge } from '../../components/badge';
import { Button } from '../../components/button';
import { Checkbox } from '../../components/checkbox';
import { EmptyState } from '../../components/empty-state';
import { Heading } from '../../components/heading';
import { RouterProvider } from '../../components/link';
import { Menu, MenuItem } from '../../components/menu';
import { MessageList, markRead, selectBy } from '../../components/message-list';
import { Pagination } from '../../components/pagination';
import { SearchField } from '../../components/search-field';
import { Switch } from '../../components/switch';
import { cn } from '../../utils/cn';
import { folders, makeMailbox, type FolderId, type Mail } from './mail-data';
import {
  markedMessage,
  pageOf,
  selectAllState,
  unreadCounts,
  visibleMessages,
} from './mail-logic';

const PAGE_SIZE = 25;

export type MailPageProps = {
  /** The starting mailbox. @default makeMailbox() */
  initialMessages?: Mail[];
};

/**
 * A mail app, built only from library parts: AppShell + SideNav (folders),
 * MessageList, a toolbar (Checkbox, Menu, Buttons, Pagination), SearchField, Switch,
 * EmptyState and Heading. A pattern, not a library export: copy it into an app and
 * swap the in-memory data for your API.
 *
 * Accessibility decisions:
 * - Bulk actions keep focus where it is and say what happened in a polite status
 *   line ("3 conversations marked as read."): the rows only change style, which a
 *   screen reader wouldn't notice.
 * - Opening a message keeps focus in the list on wide screens (↑/↓ keep browsing;
 *   the pane is a labelled region you can Tab to). On narrow screens the pane
 *   *replaces* the list, so focus moves to its heading, and Back returns it.
 */
export function MailPage({ initialMessages }: MailPageProps) {
  const [messages, setMessages] = useState(
    () => initialMessages ?? makeMailbox(),
  );
  const [folder, setFolder] = useState<FolderId>('inbox');
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string>();
  const [status, setStatus] = useState('');
  const paneHeading = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(
    () => visibleMessages(messages, folder, query, unreadOnly),
    [messages, folder, query, unreadOnly],
  );
  const {
    slice,
    page: current,
    pageCount,
    range,
  } = pageOf(visible, page, PAGE_SIZE);
  const pageIds = slice.map((m) => m.id);
  const all = selectAllState(pageIds, selected);
  const counts = unreadCounts(messages);
  const open = messages.find((m) => m.id === openId);
  const folderLabel = folders.find((f) => f.id === folder)?.label ?? '';

  // Anything that changes which messages are listed starts a fresh selection.
  const resetView = () => {
    setSelected([]);
    setPage(1);
  };

  const mark = (read: boolean) => {
    setMessages((ms) => markRead(ms, selected, read));
    setStatus(markedMessage(selected.length, read));
  };

  const openMessage = (id: string) => {
    setOpenId(id);
    setMessages((ms) => markRead(ms, [id], true));
    // Narrow screens: the pane replaces the list, so the focused row disappears.
    // Move focus to the pane's heading (after it renders) so it isn't lost.
    if (window.matchMedia?.('(max-width: 767px)').matches) {
      requestAnimationFrame(() => paneHeading.current?.focus());
    }
  };

  const back = () => {
    setOpenId(undefined);
    // The grid puts focus back on the row it last had.
    requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLElement>('[role="grid"]')?.focus(),
    );
  };

  return (
    <RouterProvider
      navigate={(path) => {
        const id = path.split('/').pop() as FolderId;
        setFolder(id);
        setOpenId(undefined);
        setQuery('');
        resetView();
      }}
    >
      <AppShell
        brand={<span className="px-1 text-base">Acme Mail</span>}
        sidebar={
          <SideNav aria-label="Folders">
            <SideNavSection>
              {folders.map((f) => (
                <SideNavItem
                  key={f.id}
                  href={`/mail/${f.id}`}
                  current={f.id === folder}
                  icon={<FolderIcon />}
                  end={
                    counts[f.id] > 0 && (
                      // Screen readers get ", 20 unread" (the leading comma keeps the
                      // pause: a leading space in sr-only text is trimmed from the
                      // name); the bare "20" is visual only.
                      <Badge tone="info">
                        <span aria-hidden="true">{counts[f.id]}</span>
                        <span className="sr-only">, {counts[f.id]} unread</span>
                      </Badge>
                    )
                  }
                >
                  {f.label}
                </SideNavItem>
              ))}
            </SideNavSection>
          </SideNav>
        }
      >
        <div className="flex flex-col gap-4">
          <Heading level={1} size="lg">
            {folderLabel}
          </Heading>

          <div className="flex flex-wrap items-center gap-3">
            <SearchField
              aria-label={`Search ${folderLabel}`}
              placeholder={`Search ${folderLabel.toLowerCase()}`}
              value={query}
              onChange={(q) => {
                setQuery(q);
                resetView();
              }}
              className="w-full max-w-sm"
            />
            <Switch
              size="sm"
              checked={unreadOnly}
              onChange={(on) => {
                setUnreadOnly(on);
                resetView();
              }}
            >
              Unread only
            </Switch>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* The list column. Narrow screens: hidden while a message is open. */}
            <div
              ref={listRef}
              className={cn(
                'flex min-w-0 flex-col rounded-md border border-border',
                open && 'max-md:hidden',
              )}
            >
              <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
                {/* The page's checkbox: all, some (the dash) or none of the rows on
                    this page. Its name says what it acts on. */}
                <Checkbox
                  aria-label="Select all on this page"
                  checked={all === 'all'}
                  indeterminate={all === 'some'}
                  disabled={pageIds.length === 0}
                  onChange={(e) => setSelected(e.target.checked ? pageIds : [])}
                  className="me-1"
                />
                <Menu
                  label={<ChevronDownIcon />}
                  aria-label="Select by"
                  intent="ghost"
                  size="sm"
                  chevron={false}
                  menuSize="sm"
                >
                  <MenuItem
                    onAction={() => setSelected(selectBy(slice, 'all'))}
                  >
                    All
                  </MenuItem>
                  <MenuItem onAction={() => setSelected([])}>None</MenuItem>
                  <MenuItem
                    onAction={() => setSelected(selectBy(slice, 'read'))}
                  >
                    Read
                  </MenuItem>
                  <MenuItem
                    onAction={() => setSelected(selectBy(slice, 'unread'))}
                  >
                    Unread
                  </MenuItem>
                </Menu>
                <Button
                  intent="ghost"
                  size="sm"
                  disabled={selected.length === 0}
                  onClick={() => mark(true)}
                >
                  Mark as read
                </Button>
                <Button
                  intent="ghost"
                  size="sm"
                  disabled={selected.length === 0}
                  onClick={() => mark(false)}
                >
                  Mark as unread
                </Button>
              </div>
              <MessageList
                aria-label={folderLabel}
                messages={slice}
                selected={selected}
                onSelectionChange={setSelected}
                openId={openId}
                onOpen={openMessage}
                emptyState={
                  query || unreadOnly
                    ? 'No messages match. Try another search, or turn off Unread only.'
                    : `Nothing in ${folderLabel}.`
                }
                className="max-h-[32rem]"
              />
              {/* Paging in a footer: the toolbar keeps one row on narrower columns. */}
              <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-1.5">
                <span className="text-xs text-fg-muted tabular-nums">
                  {range}
                </span>
                <Pagination
                  aria-label={`${folderLabel} pages`}
                  variant="compact"
                  page={current}
                  pageCount={pageCount}
                  onChange={(p) => {
                    setPage(p);
                    setSelected([]);
                  }}
                />
              </div>
            </div>

            {/* The reading pane. A labelled region, so it's a landmark screen-reader
                users can jump to. Narrow screens: shown only while a message is open. */}
            <section
              aria-label="Reading pane"
              className={cn(
                'min-w-0 rounded-md border border-border p-5',
                !open && 'max-md:hidden',
              )}
            >
              {open ? (
                <article className="flex flex-col gap-4">
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={back}
                    className="self-start md:hidden"
                  >
                    ← Back to {folderLabel}
                  </Button>
                  <div className="flex flex-col gap-1">
                    {/* tabIndex -1: focusable from code (narrow screens), not a Tab stop. */}
                    <Heading
                      ref={paneHeading}
                      tabIndex={-1}
                      level={2}
                      size="md"
                      className="outline-hidden focus-visible:outline-2 focus-visible:outline-focus-ring"
                    >
                      {open.subject}
                    </Heading>
                    <p className="text-sm text-fg-muted">
                      From <span className="text-fg">{open.from}</span> to{' '}
                      {open.to} ·{' '}
                      <time dateTime={open.dateTime}>{open.date}</time>
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 text-sm">
                    {open.body.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </article>
              ) : (
                <EmptyState
                  headingLevel={2}
                  size="compact"
                  icon={<MailIcon />}
                  title="No message open"
                  description="Choose a message from the list to read it here."
                />
              )}
            </section>
          </div>

          {/* Bulk-action results, for screen readers (and visible, for everyone). */}
          <p role="status" className="min-h-5 text-sm text-fg-muted">
            {status}
          </p>
        </div>
      </AppShell>
    </RouterProvider>
  );
}

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}
function FolderIcon() {
  return (
    <Svg className="size-4">
      <path d="M1.75 4.25v8h12.5v-6.5H7.5L6 4.25z" />
    </Svg>
  );
}
function ChevronDownIcon() {
  return (
    <Svg className="size-4">
      <path d="m4 6 4 4 4-4" />
    </Svg>
  );
}
function MailIcon() {
  return (
    <Svg>
      <path d="M2 3.5h12v9H2zM2 4l6 5 6-5" />
    </Svg>
  );
}
