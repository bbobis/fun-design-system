import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sends one file to your server. Call `onProgress` with how much is done, from 0 to 1
 * (skip it if you can't know: the bar then just shows activity). Pass `signal` to
 * `fetch`/`axios` so Cancel stops the request. Throw (or reject) to fail; the error's
 * `message` is shown to the person, so make it something they can act on.
 */
export type UploadFn = (
  file: File,
  context: { onProgress: (fraction: number) => void; signal: AbortSignal },
) => Promise<unknown>;

/** Where one file's upload is. No entry at all means "not uploaded by us" (e.g. `defaultValue`). */
export type UploadState =
  | {
      status: 'uploading';
      /** 0–1, or undefined when unknown */ progress?: number;
    }
  | { status: 'error'; message: string }
  | { status: 'done' };

/**
 * Runs `upload` per file and tracks each one's state, keyed by the `File` object itself
 * (files have no id, but the same object stays in the list while it's there).
 * Uploads are aborted when their file leaves `files`, and when the component unmounts.
 */
export function useUploads(
  upload: UploadFn | undefined,
  files: readonly File[],
  announce: (message: string) => void,
) {
  const [states, setStates] = useState<ReadonlyMap<File, UploadState>>(
    () => new Map(),
  );
  const controllers = useRef(new Map<File, AbortController>());
  // Always call the latest `upload` and `announce`, without restarting anything when
  // the parent passes a new function each render.
  const latest = useRef({ upload, announce });
  useEffect(() => {
    latest.current = { upload, announce };
  });

  // Two uploads finishing at the same moment would overwrite each other's message
  // (React merges the two updates). Collect messages for one tick, then say them together.
  const pending = useRef<string[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const say = (message: string) => {
    pending.current.push(message);
    flushTimer.current ??= setTimeout(() => {
      flushTimer.current = undefined;
      latest.current.announce(pending.current.join(' '));
      pending.current = [];
    }, 0);
  };

  const setState = (file: File, state: UploadState | undefined) =>
    setStates((prev) => {
      const next = new Map(prev);
      if (state) next.set(file, state);
      else next.delete(file);
      return next;
    });

  const start = useCallback((file: File) => {
    const run = latest.current.upload;
    if (!run) return;
    controllers.current.get(file)?.abort();
    const controller = new AbortController();
    controllers.current.set(file, controller);
    const { signal } = controller;
    setState(file, { status: 'uploading' });

    const onProgress = (fraction: number) => {
      if (signal.aborted) return;
      setState(file, {
        status: 'uploading',
        progress: Math.min(1, Math.max(0, fraction)),
      });
    };
    // Promise.resolve().then(): a function that throws synchronously still lands in
    // the error branch below instead of crashing the drop handler.
    Promise.resolve()
      .then(() => run(file, { onProgress, signal }))
      .then(
        () => {
          if (signal.aborted) return; // cancelled: the row is already gone
          controllers.current.delete(file);
          setState(file, { status: 'done' });
          say(`Uploaded ${file.name}.`);
        },
        (error: unknown) => {
          if (signal.aborted) return;
          controllers.current.delete(file);
          const message =
            error instanceof Error && error.message
              ? error.message
              : 'Something went wrong.';
          setState(file, { status: 'error', message });
          say(`${file.name} didn’t upload: ${message}`);
        },
      );
  }, []);

  // A file left the list (Remove, Cancel, replaced, or the app changed `value`):
  // stop its upload and forget its state.
  useEffect(() => {
    const present = new Set(files);
    for (const [file, controller] of controllers.current) {
      if (!present.has(file)) {
        controller.abort();
        controllers.current.delete(file);
      }
    }
    setStates((prev) =>
      [...prev.keys()].every((f) => present.has(f))
        ? prev
        : new Map([...prev].filter(([f]) => present.has(f))),
    );
  }, [files]);

  // Leaving the page (or closing the dialog) mid-upload: don't keep sending.
  useEffect(() => {
    const all = controllers.current;
    return () => {
      clearTimeout(flushTimer.current);
      for (const controller of all.values()) controller.abort();
      all.clear();
    };
  }, []);

  return { states, start };
}
