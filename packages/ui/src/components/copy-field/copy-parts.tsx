import type { SVGProps } from 'react';
import type { CopyState } from '../../utils/use-copy';

/*
 * The pieces every copy button shares (CopyField, DescriptionList): the icons and
 * the status message screen readers hear.
 */

/**
 * A polite live region. Always in the DOM (only its text changes), so screen readers
 * notice the change and read it without interrupting.
 */
export function CopyStatus({ state }: { state: CopyState }) {
  return (
    <span role="status" className="sr-only">
      {state === 'copied'
        ? 'Copied'
        : state === 'failed'
          ? 'Couldn’t copy. Select the text and copy it yourself.'
          : ''}
    </span>
  );
}

/** Copy, ✓ or ⚠, depending on how the last copy went. */
export function CopyStateIcon({
  state,
  className,
}: {
  state: CopyState;
  className?: string;
}) {
  if (state === 'copied') return <CheckIcon className={className} />;
  if (state === 'failed') return <AlertIcon className={className} />;
  return <CopyIcon className={className} />;
}

/** Colour for the button while it shows ✓ or ⚠ (icons need 3:1, both pass). */
export const copyStateClass = (state: CopyState) =>
  state === 'copied'
    ? 'text-success hover:text-success'
    : state === 'failed'
      ? 'text-danger hover:text-danger'
      : '';

export function Svg(props: SVGProps<SVGSVGElement>) {
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
const CopyIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <rect x="5.25" y="5.25" width="8" height="8.5" rx="1.5" />
    <path d="M10.75 5.25V3.75a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v6a1.5 1.5 0 0 0 1.5 1.5h1.5" />
  </Svg>
);
const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p} strokeWidth={2}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Svg>
);
const AlertIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.75v3.75M8 11h.01" />
  </Svg>
);
export const EyeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
    <circle cx="8" cy="8" r="1.75" />
  </Svg>
);
export const EyeOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}>
    <path d="M6.2 3.8A6.6 6.6 0 0 1 8 3.5c4 0 6.5 4.5 6.5 4.5a11 11 0 0 1-1.9 2.4M10.1 10.4A3 3 0 0 1 5.6 6M3.6 5.2A11 11 0 0 0 1.5 8s2.5 4.5 6.5 4.5a6.4 6.4 0 0 0 2.9-.7" />
    <path d="m2 2 12 12" />
  </Svg>
);
