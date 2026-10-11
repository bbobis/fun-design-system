import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  Button,
  ComboBox as AriaComboBox,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Group,
  Input,
  useFilter,
} from 'react-aria-components';
import { cn } from '../../../utils/cn';
import { ChevronIcon, ComboboxPopover } from '../../combobox/combobox-parts';
import {
  CalendarIcon,
  CalendarPopover,
} from '../../date-picker/calendar-popover';
import { toCalendarDate } from '../../date-picker/iso-date';
import type { DataGridSearchOptions } from '../data-grid-features';
import {
  PopoverEditorShell,
  type CellEditorHandle,
  type EditorCommit,
} from './popover-editor';

type PopoverCellEditorProps = {
  /** Accessible name, usually the column header. */
  label: string;
  /** The cell's current value as text ('' = empty). */
  initialValue: string;
  editorRef: RefObject<CellEditorHandle | null>;
  onCommit: (action: EditorCommit) => boolean | void;
  onLeave: () => void;
};

// Fills the cell like the native editors: no border of its own, the primary ring instead.
const box =
  'flex h-full w-full min-w-0 items-center bg-bg text-sm text-fg outline-2 -outline-offset-2 outline-primary';

/** How long to wait after the last keystroke before searching the server. */
const SEARCH_DELAY_MS = 250;

/**
 * Searchable list editor (`meta.editor: 'combobox'`). Typing filters the list; Enter,
 * Tab or a click picks and commits. With `searchOptions`, the list comes from your
 * server instead of `options`.
 */
export function ComboboxCellEditor({
  label,
  initialValue,
  seed,
  options = [],
  searchOptions,
  editorRef,
  onCommit,
  onLeave,
}: PopoverCellEditorProps & {
  /** The key that started the edit (type-to-replace): becomes the search text. */
  seed?: string;
  options?: readonly string[];
  searchOptions?: DataGridSearchOptions;
}) {
  const value = useRef(initialValue);
  const open = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    editorRef.current = {
      getValue: () => value.current,
      focus: () => input.current?.focus(),
    };
    return () => {
      editorRef.current = null;
    };
  }, [editorRef]);

  // Focus on mount with the caret at the end (same reason as CellEditor: type-to-replace).
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  // Server search: debounce the request (not the typing) and cancel the previous one.
  const [results, setResults] = useState<readonly string[] | null>(null);
  const [loading, setLoading] = useState(searchOptions !== undefined);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const request = useRef<AbortController>(undefined);
  const search = (query: string) => {
    if (!searchOptions) return;
    clearTimeout(timer.current);
    setLoading(true);
    timer.current = setTimeout(() => {
      request.current?.abort();
      const ctrl = new AbortController();
      request.current = ctrl;
      searchOptions(query, ctrl.signal).then(
        (found) => {
          if (ctrl.signal.aborted) return;
          setResults(found);
          setLoading(false);
        },
        () => {
          if (!ctrl.signal.aborted) setLoading(false);
        },
      );
    }, SEARCH_DELAY_MS);
  };
  useEffect(() => {
    search(seed ?? '');
    return () => {
      clearTimeout(timer.current);
      request.current?.abort();
    };
    // Once, on mount: later searches come from typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The search text. Starts empty (show every choice) or as the typed letter.
  const [query, setQuery] = useState(seed ?? '');
  const { contains } = useFilter({ sensitivity: 'base' });
  const items = useMemo(() => {
    const list = searchOptions ? (results ?? []) : options;
    const untouched = query === '' || query === initialValue;
    // Like the native select editor: a value that isn't a choice (old data) still
    // shows. With server search, only until the user types: results replace it.
    const all =
      initialValue &&
      !list.includes(initialValue) &&
      (!searchOptions || untouched)
        ? [initialValue, ...list]
        : list;
    // We filter here, not React Aria: "open on focus" would otherwise show every
    // choice even after type-to-replace. Server results arrive already filtered.
    const shown =
      searchOptions || untouched ? all : all.filter((o) => contains(o, query));
    return shown.map((o) => ({ value: o, label: o }));
  }, [options, results, searchOptions, initialValue, query, contains]);

  return (
    <PopoverEditorShell openRef={open} onCommit={onCommit} onLeave={onLeave}>
      {(picked) => (
        <AriaComboBox
          // Already filtered (above), so React Aria shows them as given.
          items={items}
          defaultValue={initialValue || null}
          // Type-to-replace: the typed letter becomes the search text. Otherwise the
          // value itself (React Aria can't look up the label before the list exists).
          defaultInputValue={seed ?? initialValue}
          // Open as soon as the editor gets focus: a cell editor is always "in use".
          menuTrigger="focus"
          allowsEmptyCollection
          onOpenChange={(isOpen) => {
            open.current = isOpen;
          }}
          onInputChange={(text) => {
            setQuery(text);
            search(text);
          }}
          onChange={(key) => {
            value.current = key == null ? '' : String(key);
            picked();
          }}
          aria-label={label}
          className="contents"
        >
          <Group className={cn(box, 'ps-3')}>
            <Input
              ref={input}
              className="h-full min-w-0 flex-1 bg-transparent outline-hidden"
            />
            <Button className="flex h-full shrink-0 items-center px-2 text-fg-muted hover:text-fg">
              <ChevronIcon className="size-4" />
            </Button>
          </Group>
          <ComboboxPopover loading={loading} emptyMessage="No matches" />
        </AriaComboBox>
      )}
    </PopoverEditorShell>
  );
}

/**
 * Calendar-day editor (`meta.editor: 'date'`). Type the day piece by piece (the user's
 * locale order; ↑↓ change a piece), or open the calendar with Alt+↓ or the button.
 * The value stays an ISO string, `'YYYY-MM-DD'`: ISO in, ISO out.
 */
export function DateCellEditor({
  label,
  initialValue,
  editorRef,
  onCommit,
  onLeave,
}: PopoverCellEditorProps) {
  const value = useRef(initialValue);
  const open = useRef(false);
  const group = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    editorRef.current = {
      getValue: () => value.current,
      // The first date piece (month, day or year, whichever the locale puts first).
      focus: () =>
        group.current
          ?.querySelector<HTMLElement>('[role="spinbutton"]')
          ?.focus(),
    };
    return () => {
      editorRef.current = null;
    };
  }, [editorRef]);

  return (
    <PopoverEditorShell openRef={open} onCommit={onCommit} onLeave={onLeave}>
      {(picked) => (
        <AriaDatePicker
          defaultValue={toCalendarDate(initialValue)}
          granularity="day"
          autoFocus
          onOpenChange={(isOpen) => {
            open.current = isOpen;
          }}
          onChange={(next) => {
            value.current = next ? next.toString() : '';
            // Typing changes the value piece by piece: only a day picked in the
            // calendar is a finished choice. Typed dates commit on Enter / Tab / blur.
            if (open.current) picked();
          }}
          aria-label={label}
          className="contents"
        >
          <Group ref={group} className={cn(box, 'ps-2.5')}>
            <DateInput className="flex flex-1 items-center">
              {(segment) => (
                <DateSegment
                  segment={segment}
                  className={cn(
                    'rounded px-0.5 tabular-nums caret-transparent outline-hidden',
                    'focus:bg-primary focus:text-on-primary',
                    'data-placeholder:text-fg-muted',
                    'data-[type=literal]:px-0 data-[type=literal]:text-fg-muted',
                  )}
                />
              )}
            </DateInput>
            <Button className="flex h-full shrink-0 items-center px-2 text-fg-muted hover:text-fg">
              <CalendarIcon className="size-4" />
            </Button>
          </Group>
          <CalendarPopover />
        </AriaDatePicker>
      )}
    </PopoverEditorShell>
  );
}
