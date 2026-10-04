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
