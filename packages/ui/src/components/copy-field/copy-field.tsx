import { useId, useState, type ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { useCopy } from '../../utils/use-copy';
import { useFieldContext } from '../field/field-context';
import { Input } from '../input';
import {
  CopyStateIcon,
  CopyStatus,
  copyStateClass,
  EyeIcon,
  EyeOffIcon,
} from './copy-parts';

export type CopyFieldProps = {
  /** The text to show and copy: an API key, a link, a webhook URL. */
  value: string;
  /**
   * Hide the value as dots (`type="password"`) until the user presses Show. Copy
   * still copies the real value, without revealing it. @default false
   */
  secret?: boolean;
  /**
   * Name, when there's no Field around it ("API key"). Inside a Field, the Field's
   * label names the input and finishes the buttons' names ("Copy API key").
   */
  'aria-label'?: string;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Monospace text, for keys and ids. @default true when `secret`, else false */
  mono?: boolean;
  /** Classes for the box (width). */
  className?: string;
};

/**
 * A read-only value with a copy button: API keys, share links, webhook URLs. Put it
 * in a Field for the label and help text.
 *
 * - The input is real and read-only: screen readers say "API key, read only", and
 *   focusing it selects everything, so copying by hand works too.
 * - The buttons are named from the Field's label with `aria-labelledby` (their own
 *   word + the label's id): "Copy API key", "Show API key".
 * - After copying, a polite "Copied" (or why it failed) for screen readers.
 */
export function CopyField({
  value,
  secret = false,
  'aria-label': ariaLabel,
  size = 'md',
  mono,
  className,
}: CopyFieldProps) {
  const field = useFieldContext();
  const ids = useId();
  const [revealed, setRevealed] = useState(false);
  const { state, copy } = useCopy();
  const hidden = secret && !revealed;

  /**
   * "Copy" + the field's name. Inside a Field: aria-labelledby joins this button's
   * own word (a hidden span) with the label element, so the name follows the label.
   */
  const nameProps = (word: string, wordId: string) =>
    field
      ? { 'aria-labelledby': `${wordId} ${field.labelId}` }
      : { 'aria-label': `${word} ${ariaLabel ?? 'value'}` };

  const iconButton = (
    word: string,
    wordId: string,
    icon: ReactNode,
    onPress: () => void,
    extra?: { pressed?: boolean; className?: string },
  ) => (
    <button
      type="button"
      {...nameProps(word, wordId)}
      aria-pressed={extra?.pressed}
      onClick={onPress}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded text-fg-muted hover:bg-surface hover:text-fg',
        'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus-ring',
        extra?.className,
      )}
    >
      {/* hidden, yet still usable by aria-labelledby: a referenced element's text
          counts even when it isn't shown. */}
      <span id={wordId} hidden>
        {word}
      </span>
      {icon}
    </button>
  );

  return (
    <>
      <Input
        readOnly
        value={value}
        // The browser draws the dots; switching to "text" shows the value.
        type={hidden ? 'password' : 'text'}
        // Not a login: keep password managers from offering to save it.
        autoComplete="off"
        spellCheck={false}
        aria-label={field ? undefined : ariaLabel}
        // Select everything on focus, so Ctrl+C / ⌘C copies the whole value.
        onFocus={(e) => e.currentTarget.select()}
        size={size}
        // With an adornment, className styles the box; the input inherits its font.
        // Monospace for keys: l / 1 / I and O / 0 are easy to confuse.
        className={cn('pe-1', (mono ?? secret) && 'font-mono', className)}
        endAdornment={
          <span className="flex items-center gap-0.5">
            {secret &&
              iconButton(
                'Show',
                `${ids}-show`,
                revealed ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                ),
                () => setRevealed((r) => !r),
                { pressed: revealed },
              )}
            {iconButton(
              'Copy',
              `${ids}-copy`,
              <CopyStateIcon state={state} className="size-4" />,
              () => void copy(value),
              { className: copyStateClass(state) },
            )}
          </span>
        }
      />
      <CopyStatus state={state} />
    </>
  );
}
