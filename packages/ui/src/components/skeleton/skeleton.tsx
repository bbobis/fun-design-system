import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const skeletonVariants = cva(
  'block animate-pulse bg-surface motion-reduce:animate-none',
  {
    variants: {
      shape: {
        /** One line of text: text height, full width (narrow it with className). */
        text: 'h-[1em] w-full rounded',
        rect: 'rounded-md',
        circle: 'rounded-full',
      },
    },
    defaultVariants: { shape: 'text' },
  },
);

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
 * @example
 * <section aria-busy={loading} aria-label="Invoice details">
 *   {loading ? <><Skeleton className="w-1/3" /><Skeleton /></> : <Details />}
 * </section>
 */
export function Skeleton({ shape, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
    />
  );
}
