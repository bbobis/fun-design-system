import type { ReactNode, SVGProps } from 'react';

/**
 * The status icons shared by Alert and Toast, so a "warning" looks the same in both.
 * All decorative (`aria-hidden`): the tone is also said in words.
 */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

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

export const statusIcons: Record<
  StatusTone,
  (p: SVGProps<SVGSVGElement>) => ReactNode
> = {
  // A bell: "something to know", with no good or bad news in it.
  neutral: (p) => (
    <Svg {...p}>
      <path d="M4.25 11.25V7a3.75 3.75 0 0 1 7.5 0v4.25l1 1H3.25z" />
      <path d="M6.75 13.75a1.25 1.25 0 0 0 2.5 0" />
    </Svg>
  ),
  info: (p) => (
    <Svg {...p}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25v3.5M8 5.25h.01" />
    </Svg>
  ),
  success: (p) => (
    <Svg {...p}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="m5.5 8.25 1.75 1.75 3.25-3.75" />
    </Svg>
  ),
  warning: (p) => (
    <Svg {...p}>
      <path d="M8 2.25 1.75 13.25h12.5z" />
      <path d="M8 6.75v3M8 11.5h.01" />
    </Svg>
  ),
  danger: (p) => (
    <Svg {...p}>
      <circle cx="8" cy="8" r="6.25" />
      <path d="m5.75 5.75 4.5 4.5m0-4.5-4.5 4.5" />
    </Svg>
  ),
};

export function XIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p} strokeWidth={1.75}>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </Svg>
  );
}
