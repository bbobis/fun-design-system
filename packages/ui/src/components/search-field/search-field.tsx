import { cva, type VariantProps } from 'class-variance-authority';
import type { SVGProps } from 'react';
import {
  Button,
  Group,
  Input,
  SearchField as AriaSearchField,
} from 'react-aria-components';
import { cn } from '../../utils/cn';
import { SpinnerIcon, XIcon } from '../combobox/combobox-parts';
import { useFieldContext } from '../field/field-context';

// Same heights and look as Input, so a search box lines up with other fields.
const boxVariants = cva(
  [
    'flex w-full min-w-0 items-center rounded-md border border-border-strong bg-bg text-fg transition-colors',
    // Ring while the input has focus (it's a text field, so by mouse too, like Input).
    'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-solid focus-within:outline-focus-ring',
    'group-data-invalid:border-danger',
    'group-data-disabled:cursor-not-allowed group-data-disabled:bg-surface group-data-disabled:opacity-60',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 gap-1.5 ps-2.5 text-sm',
        md: 'h-10 gap-2 ps-3 text-sm',
        lg: 'h-12 gap-2 ps-4 text-base',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export type SearchFieldProps = VariantProps<typeof boxVariants> & {
  /** The text (controlled). */
  value?: string;
  /** Starting text when uncontrolled. */
  defaultValue?: string;
  /** Called on every keystroke. Debounce in the app if each change hits a server. */
  onChange?: (value: string) => void;
  /** Enter pressed: search now (e.g. go to a results page). */
  onSubmit?: (value: string) => void;
  /** The field was cleared with ✕ or Escape. `onChange('')` fires too. */
  onClear?: () => void;
  /** Hint inside the box ("Search invoices"). Not a label: give it `aria-label` or a Field. */
  placeholder?: string;
  /** Shows a spinner instead of the 🔍 while results load. */
  loading?: boolean;
  /** Form field name. */
  name?: string;
  /** Marks it invalid. Inside a Field, set for you when it has an `error`. */
  invalid?: boolean;
  disabled?: boolean;
  /** id of the input. Inside a Field, the Field's control id. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Classes for the outer wrapper (width, margins). */
  className?: string;
};

/**
 * A search box: type to filter, Enter to submit, Escape (or the ✕) to clear.
 *
 * The ✕ appears only when there's text. It isn't a Tab stop (keyboard users have
 * Escape), and React Aria names it "Clear search". The input is `type="search"`, so
 * phones show a search key. Built on React Aria `SearchField`.
 *
 * @example
 * <SearchField aria-label="Search invoices" value={q} onChange={setQ} />
 */
export function SearchField({
  value,
  defaultValue,
  onChange,
  onSubmit,
  onClear,
  placeholder,
  loading = false,
  name,
  size,
  invalid,
  disabled,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  className,
}: SearchFieldProps) {
  const field = useFieldContext();
  const describedBy =
    [field?.describedBy, ariaDescribedBy].filter(Boolean).join(' ') ||
    undefined;

  return (
    <AriaSearchField
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onSubmit={onSubmit}
      onClear={onClear}
      name={name}
      // false on purpose: React Aria's only own check here is `required`, and the app
      // owns that message (component-recipe.md, rule 24).
      isInvalid={invalid ?? field?.invalid ?? false}
      isRequired={field?.required ?? false}
      isDisabled={disabled ?? field?.disabled ?? false}
      validationBehavior="aria"
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel ? undefined : field?.labelId)
      }
      aria-describedby={describedBy}
      className={cn('group flex w-full flex-col', className)}
    >
      <Group className={boxVariants({ size })}>
        {loading ? (
          <span className="flex shrink-0 text-fg-muted">
            {/* Decorative: tell screen readers about loading in your results area. */}
            <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
          </span>
        ) : (
          <SearchIcon className="size-4 shrink-0 text-fg-muted" />
        )}
        <Input
          id={id ?? field?.controlId}
          placeholder={placeholder}
          className={cn(
            'h-full min-w-0 flex-1 bg-transparent outline-hidden placeholder:text-fg-muted',
            // Hide the browser's own ✕ for type="search": we draw ours.
            '[&::-webkit-search-cancel-button]:appearance-none',
          )}
        />
        {/* React Aria wires this Button to clear the field and names it "Clear search". */}
        <Button
          className={cn(
            'me-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded text-fg-muted outline-hidden hover:bg-surface hover:text-fg',
            // No text, no ✕.
            'group-data-empty:invisible',
          )}
        >
          <XIcon className="size-4" />
        </Button>
      </Group>
    </AriaSearchField>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      {...props}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}
