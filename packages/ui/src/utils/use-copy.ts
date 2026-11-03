import { useEffect, useRef, useState } from 'react';

export type CopyState = 'idle' | 'copied' | 'failed';

/**
 * Copy text to the clipboard and remember how it went for 2 seconds.
 *
 * `navigator.clipboard` only exists on https (and localhost), can be blocked by the
 * browser or an iframe's permissions, and `writeText` returns a Promise that may
 * reject. So `failed` is a real state the UI must show, not an edge case to ignore.
 *
 * @example
 * const { state, copy } = useCopy();
 * <button onClick={() => void copy(value)}>{state === 'copied' ? '✓' : 'Copy'}</button>
 */
export function useCopy(resetAfterMs = 2000) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (text: string) => {
    clearTimeout(timer.current);
    try {
      if (!navigator.clipboard) throw new Error('Clipboard not available');
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    timer.current = setTimeout(() => setState('idle'), resetAfterMs);
  };

  return { state, copy };
}
