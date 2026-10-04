import { useEffect, useRef, useState } from 'react';
import { Button } from '../../button';

type SaveBarProps = {
  /** Changed cells. */
  changeCount: number;
  /** Rows with at least one change. */
  rowCount: number;
  saving: boolean;
  /** Shown before the buttons, e.g. "Couldn't save. Your changes are kept." */
  message?: string;
  onSave: () => void;
  onDiscard: () => void;
  /** Shows an Undo button (Ctrl+Z does the same). */
  canUndo?: boolean;
  onUndo?: () => void;
  /** Invalid cells. Save stays clickable (it jumps to the first error instead). */
  errorCount?: number;
  onGoToError?: () => void;
  /** The first unresolved conflict, if the last save returned some. */
  conflict?: { message: string; remaining: number };
  onUseTheirs?: () => void;
  onKeepMine?: () => void;
};

/**
 * The sticky "N changes · Discard · Save all" bar. Inverse surface (data-inverse) so it
 * stands out. Discard asks first, inline, because it throws work away.
 */
export function SaveBar({
  changeCount,
  rowCount,
  saving,
  message,
  onSave,
  onDiscard,
  canUndo = false,
  onUndo,
  errorCount = 0,
  onGoToError,
  conflict,
  onUseTheirs,
  onKeepMine,
}: SaveBarProps) {
  const [confirming, setConfirming] = useState(false);
  const discardRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);

  // When the question appears, focus the safe choice; when it goes away, return focus
  // to the Discard button that opened it. Keyboard users never lose their place.
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirming) keepRef.current?.focus();
    else if (wasConfirming.current) discardRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);
  const plural = (n: number, word: string) =>
    `${n.toLocaleString()} ${word}${n === 1 ? '' : 's'}`;

  if (conflict) {
    // A conflict blocks everything else: decide row by row, then save again.
    return (
      <div
        data-inverse
        role="group"
        aria-label="Save conflict"
        className="flex flex-wrap items-center gap-2 bg-bg px-4 py-2 text-sm text-fg"
      >
        <span>
          <b className="font-semibold">{conflict.message}</b> Nothing was saved.
          {conflict.remaining > 1 &&
            ` (${conflict.remaining - 1} more after this)`}
        </span>
        <span className="flex-1" />
        <Button intent="ghost" size="sm" onClick={onUseTheirs}>
          Use theirs
        </Button>
        <Button intent="primary" size="sm" onClick={onKeepMine}>
          Keep mine
        </Button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div
        data-inverse
        className="flex flex-wrap items-center gap-2 bg-bg px-4 py-2 text-sm text-fg"
      >
        <span>
          <b className="font-semibold">
            Discard {plural(changeCount, 'change')}?
          </b>{' '}
          This can't be undone.
        </span>
        <span className="flex-1" />
        <Button
          intent="ghost"
          size="sm"
          ref={keepRef}
          onClick={() => setConfirming(false)}
        >
          Keep editing
        </Button>
        <Button
          intent="danger"
          size="sm"
          onClick={() => {
            setConfirming(false);
            onDiscard();
          }}
        >
          Discard
        </Button>
      </div>
    );
  }

  return (
    <div
      data-inverse
      className="flex flex-wrap items-center gap-2 bg-bg px-4 py-2 text-sm text-fg"
    >
      <span className="tabular-nums">
        <b className="font-semibold">{plural(changeCount, 'change')}</b> in{' '}
        {plural(rowCount, 'row')}
      </span>
      {errorCount > 0 && (
        <>
          <span className="font-medium text-fg-danger tabular-nums">
            {plural(errorCount, 'error')}
          </span>
          {onGoToError && (
            <Button intent="ghost" size="sm" onClick={onGoToError}>
              Go to error
            </Button>
          )}
        </>
      )}
      {message && <span className="text-fg-danger">{message}</span>}
      <span className="flex-1" />
      {onUndo && (
        <Button
          intent="ghost"
          size="sm"
          disabled={saving || !canUndo}
          title="Undo (Ctrl+Z)"
          onClick={onUndo}
        >
          Undo
        </Button>
      )}
      <Button
        ref={discardRef}
        intent="ghost"
        size="sm"
        disabled={saving}
        onClick={() => setConfirming(true)}
      >
        Discard
      </Button>
      <Button intent="primary" size="sm" loading={saving} onClick={onSave}>
        {saving ? 'Saving…' : 'Save all'}
      </Button>
    </div>
  );
}
