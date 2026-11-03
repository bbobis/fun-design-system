import { useEffect, useRef, useState } from 'react';
import type { DataGridSearchOptions } from '../data-grid-features';

/** Wait this long after the last key before asking the server. */
export const SEARCH_DELAY_MS = 250;

/**
 * Server search for a `combobox` column (`meta.searchOptions`), shared by the cell
 * editor and the record drawer. It debounces the *request* (typing stays instant),
 * and aborts the previous request through its `AbortSignal`, so a slow, stale answer
 * can never replace a newer one.
 *
 * Searches `initialQuery` once on mount. Without `searchOptions` it does nothing and
 * `results` stays `null` (filter your own `options` instead).
 */
export function useServerSearch(
  searchOptions: DataGridSearchOptions | undefined,
  initialQuery = '',
) {
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
    search(initialQuery);
    return () => {
      clearTimeout(timer.current);
      request.current?.abort();
    };
    // Once, on mount: later searches come from typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { results, loading, search };
}
