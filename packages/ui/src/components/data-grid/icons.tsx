import type { SVGProps } from 'react';
import { cn } from '../../utils/cn';

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
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

export function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10.5 2.5l3 3-8 8H2.5v-3z" />
    </svg>
  );
}

export function SortIndicator({
  direction,
}: {
  direction: false | 'asc' | 'desc';
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={cn(
        'size-3 shrink-0 transition-opacity',
        // Unsorted columns stay quiet: the icon appears on hover/focus of the header only.
        !direction &&
          'opacity-0 group-hover:opacity-50 group-focus-within:opacity-50',
      )}
    >
      <path
        d="M6 2 9 5H3z"
        className={
          direction === 'asc'
            ? 'fill-current'
            : direction
              ? 'fill-current opacity-25'
              : 'fill-current'
        }
      />
      <path
        d="M6 10 3 7h6z"
        className={
          direction === 'desc'
            ? 'fill-current'
            : direction
              ? 'fill-current opacity-25'
              : 'fill-current'
        }
      />
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

export function FunnelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M2 3h12l-4.5 5.5V13l-3-1.5v-3z" />
    </svg>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
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
    >
      <path d="M2.5 4.5h11M6.5 4.5V3h3v1.5M4 4.5l.75 9h6.5l.75-9M6.75 7v4.5m2.5-4.5v4.5" />
    </svg>
  );
}

export function UndoIcon(props: SVGProps<SVGSVGElement>) {
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
    >
      <path d="M5.5 3.5 2.5 6.5l3 3" />
      <path d="M2.5 6.5h7a4 4 0 0 1 0 8h-3" />
    </svg>
  );
}
