import { useId, useRef, useState, type ReactNode, type SVGProps } from 'react';
import {
  Button as AriaButton,
  DropZone,
  FileTrigger,
  type DropItem,
  type FileDropItem,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { Button, buttonVariants } from '../button/button';
import { checkFiles, formatBytes, type RejectedFile } from './file-rules';

export type FileUploadProps = {
  /** What the files are for ("Attachments"). Names the drop zone and the list. */
  label: ReactNode;
  /** Help under the label: allowed types and size, e.g. "PDF or images, up to 10 MB". */
  description?: ReactNode;
  /** Error from your own validation ("Attach at least one receipt"). Shown under the box. */
  error?: ReactNode;
  /**
   * Allowed files, like `<input accept>`: exact types (`application/pdf`), families
   * (`image/*`) or extensions (`.csv`). Leave out to allow any file.
   */
  accept?: readonly string[];
  /** Largest allowed file, in bytes. */
  maxSize?: number;
  /** Most files in total. Ignored when `multiple` is false (then it's 1). */
  maxFiles?: number;
  /**
   * Allow more than one file. When false, a new file replaces the current one.
   * @default true
   */
  multiple?: boolean;
  /** The chosen files (controlled). */
  value?: readonly File[];
  /** Starting files when uncontrolled. */
  defaultValue?: readonly File[];
  /** Called with the full new list whenever files are added or removed. */
  onChange?: (files: File[]) => void;
  /** Shows a required marker. Checking it is up to you (pass `error`). */
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Choose files by dragging them onto the box, pasting them (Ctrl/⌘+V while the box has
 * focus), or with the "Browse files" button. Wrong types and files that are too big are
 * refused with a reason, and both outcomes are announced to screen readers.
 *
 * Built on React Aria `DropZone` (drag + paste, with a hidden drop button for screen
 * readers) and `FileTrigger` (the native file picker, filtered by `accept`).
 *
 * It only *chooses* files: uploading them is up to the app (send `value` with fetch or
 * your API client). The files can't be posted by a plain HTML form.
 *
 * @example
 * <FileUpload
 *   label="Receipts"
 *   description="PDF or images, up to 10 MB each."
 *   accept={['application/pdf', 'image/*']}
 *   maxSize={10 * 1024 * 1024}
 *   value={files}
 *   onChange={setFiles}
 * />
 */
export function FileUpload({
  label,
  description,
  error,
  accept,
  maxSize,
  maxFiles,
  multiple = true,
  value,
  defaultValue = [],
  onChange,
  required = false,
  disabled = false,
  className,
}: FileUploadProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  const [ownFiles, setOwnFiles] = useState<readonly File[]>(defaultValue);
  const files = value ?? ownFiles;
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const browseRef = useRef<HTMLButtonElement>(null);
  const removeRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const update = (next: File[]) => {
    setOwnFiles(next);
    onChange?.(next);
  };

  const add = (incoming: File[]) => {
    if (disabled || incoming.length === 0) return;
    const result = checkFiles(incoming, {
      accept,
      maxSize,
      maxFiles: multiple ? maxFiles : 1,
      // One file at a time: a new file replaces the current one.
      current: multiple ? files.length : 0,
    });
    setRejected(result.rejected);
    if (result.accepted.length > 0)
      update(multiple ? [...files, ...result.accepted] : result.accepted);
    setAnnouncement(
      [
        result.accepted.length > 0 &&
          `Added ${result.accepted.map((f) => f.name).join(', ')}.`,
        ...result.rejected.map((r) => `${r.name} ${r.reason}.`),
      ]
        .filter(Boolean)
        .join(' '),
    );
  };

  const remove = (index: number) => {
    const name = files[index]?.name;
    const next = files.filter((_, i) => i !== index);
    update(next);
    setAnnouncement(`Removed ${name}.`);
    // The button that had focus is gone. Move to the next file's Remove button (or the
    // previous one at the end), or to Browse when the list is empty, so keyboard users
    // aren't dropped back at the top of the page.
    requestAnimationFrame(() => {
      const target =
        next.length === 0
          ? browseRef.current
          : removeRefs.current[Math.min(index, next.length - 1)];
      target?.focus();
    });
  };

  const onDrop = async (items: DropItem[]) => {
    const fileItems = items.filter(
      (item): item is FileDropItem => item.kind === 'file',
    );
    add(await Promise.all(fileItems.map((item) => item.getFile())));
  };

  const describedBy =
    [description && descriptionId, error && errorId]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className={cn('flex flex-col gap-2', className)}
    >
      <span id={labelId} className="text-sm font-medium text-fg">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-0.5 text-fg-danger">
            *
          </span>
        )}
      </span>
      {description && (
        <span id={descriptionId} className="-mt-1 text-sm text-fg-muted">
          {description}
        </span>
      )}

      <DropZone
        aria-labelledby={labelId}
        isDisabled={disabled}
        // Accept any drop and explain refusals afterwards: refusing the drag itself
        // (a "no entry" cursor) gives no reason, so people don't know what to fix.
        getDropOperation={() => (disabled ? 'cancel' : 'copy')}
        onDrop={(e) => void onDrop(e.items)}
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong px-4 py-6 text-center text-sm text-fg-muted outline-hidden transition-colors',
          'data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
          // While a file is dragged over it: the box lights up, so it's clear it'll land.
          'data-drop-target:border-primary data-drop-target:bg-primary/10 data-drop-target:text-fg',
          error && 'border-danger',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <UploadIcon className="size-6" />
        <span>
          Drag files here, or{' '}
          <FileTrigger
            acceptedFileTypes={accept}
            allowsMultiple={multiple}
            onSelect={(list) => add(list ? Array.from(list) : [])}
          >
            {/* React Aria's Button, not ours: FileTrigger needs its press events. */}
            <AriaButton
              ref={browseRef}
              isDisabled={disabled}
              className={buttonVariants({
                intent: 'secondary',
                size: 'sm',
                className: 'ms-1 align-middle',
              })}
            >
              Browse files
            </AriaButton>
          </FileTrigger>
        </span>
      </DropZone>

      {/* What changed, for screen readers (the visible lists say the same). */}
      <span role="status" className="sr-only">
        {announcement}
      </span>

      {rejected.length > 0 && (
        <ul className="flex flex-col gap-0.5 text-sm text-fg-danger">
          {rejected.map((r, i) => (
            <li key={`${r.name}-${i}`}>
              <span className="font-medium">{r.name}</span> {r.reason}.
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul
          aria-labelledby={labelId}
          className="flex flex-col divide-y divide-border rounded-md border border-border"
        >
          {files.map((file, i) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
              className="flex items-center gap-3 px-3 py-2 text-sm"
            >
              <FileIcon className="size-4 shrink-0 text-fg-muted" />
              <span className="min-w-0 flex-1 truncate text-fg">
                {file.name}
              </span>
              <span className="shrink-0 text-fg-muted tabular-nums">
                {formatBytes(file.size)}
              </span>
              <Button
                ref={(el) => {
                  removeRefs.current[i] = el;
                }}
                intent="ghost"
                size="sm"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => remove(i)}
                className="-me-2 px-2"
              >
                <XIcon className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <span id={errorId} className="text-sm text-fg-danger">
          {error}
        </span>
      )}
    </div>
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
const UploadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M8 10.5v-8m0 0-3 3m3-3 3 3M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
  </Svg>
);
const FileIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M4 1.5h5.5l3 3v10H4zM9.5 1.5v3h3" />
  </Svg>
);
const XIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={1.75}>
    <path d="m4.5 4.5 7 7m0-7-7 7" />
  </Svg>
);
