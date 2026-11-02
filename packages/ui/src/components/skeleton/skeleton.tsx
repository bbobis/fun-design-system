import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const skeletonVariants = cva('block bg-surface', {
  variants: {
    shape: {
      /** One line of text: text height, full width (narrow it with className). */
      text: 'h-[1em] w-full rounded',
      rect: 'rounded-md',
      circle: 'rounded-full',
    },
    /**
     * All motion is `motion-safe:` only: with "reduce motion" on, the shapes stay,
     * still. They still say "something is coming here"; only the movement goes.
     */
    animation: {
      pulse: 'motion-safe:animate-pulse',
      // A lighter band, twice the element's width, slides through. Reversed in
      // right-to-left, so it sweeps the way people read.
      wave: [
        'bg-[linear-gradient(90deg,transparent_25%,color-mix(in_oklab,var(--color-bg)_55%,transparent)_50%,transparent_75%)] bg-size-[200%_100%]',
        'motion-safe:animate-skeleton-wave rtl:[animation-direction:reverse]',
      ],
      none: '',
    },
  },
  defaultVariants: { shape: 'text', animation: 'pulse' },
});

export type SkeletonAnimation = 'pulse' | 'wave' | 'none';

export type SkeletonProps = VariantProps<typeof skeletonVariants> & {
  /** Size and spacing, e.g. `w-2/3`, `h-24`, `size-8` for a circle. */
  className?: string;
};

/**
 * A gray placeholder in the shape of content that is still loading, so the page
 * doesn't jump when it arrives.
 *
 * It's hidden from screen readers (`aria-hidden`): gray boxes mean nothing when read
 * aloud. Tell them once instead: put `aria-busy="true"` on the region that's loading
 * and a short "Loading…" in a live region, or use a `Spinner` with a label next to it.
 *
 * `animation`: `pulse` (default) fades in and out, `wave` sweeps a light band across,
 * `none` stays still (for many skeletons at once, where motion gets busy).
 *
 * @example
 * <section aria-busy={loading} aria-label="Invoice details">
 *   {loading ? <><Skeleton className="w-1/3" /><Skeleton /></> : <Details />}
 * </section>
 */
export function Skeleton({ shape, animation, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(skeletonVariants({ shape, animation }), className)}
    />
  );
}

export type SkeletonTextProps = {
  /** How many lines. The last one is shorter, like the end of a paragraph. @default 3 */
  lines?: number;
  /** @default 'pulse' */
  animation?: SkeletonAnimation;
  /** Text size to match, as a class (`text-sm`, `text-base`): lines are 1em tall. */
  className?: string;
};

/**
 * A paragraph placeholder: `lines` text lines, the last at 60%. Lines are 1em tall with
 * a gap like normal line spacing, so put the same text-size class on it as the text
 * that will replace it, and the height barely changes when it arrives.
 */
export function SkeletonText({
  lines = 3,
  animation,
  className,
}: SkeletonTextProps) {
  return (
    <span
      aria-hidden="true"
      data-skeleton="text"
      className={cn('flex flex-col gap-[0.5em]', className)}
    >
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          animation={animation}
          className={cn(i === lines - 1 && lines > 1 && 'w-3/5')}
        />
      ))}
    </span>
  );
}

export type SkeletonMediaProps = {
  /** `avatar`: a circle (a person). `thumbnail`: a rounded square (a file, a product). @default 'avatar' */
  media?: 'avatar' | 'thumbnail';
  /** `sm` for dense lists, `md` for cards. @default 'md' */
  size?: 'sm' | 'md';
  /** @default 'pulse' */
  animation?: SkeletonAnimation;
  className?: string;
};

/**
 * A list-row placeholder: an avatar or thumbnail, then a name line and a shorter
 * detail line. Repeat it for a loading list.
 */
export function SkeletonMedia({
  media = 'avatar',
  size = 'md',
  animation,
  className,
}: SkeletonMediaProps) {
  return (
    <span
      aria-hidden="true"
      data-skeleton="media"
      className={cn(
        'flex items-center',
        size === 'sm' ? 'gap-2 text-xs' : 'gap-3 text-sm',
        className,
      )}
    >
      <Skeleton
        shape={media === 'avatar' ? 'circle' : 'rect'}
        animation={animation}
        className={cn('shrink-0', size === 'sm' ? 'size-8' : 'size-10')}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-[0.5em]">
        <Skeleton animation={animation} className="w-2/5" />
        <Skeleton animation={animation} className="w-3/5" />
      </span>
    </span>
  );
}
