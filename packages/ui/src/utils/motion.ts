/**
 * Shared enter/exit motion for React Aria popups. Internal: not exported from the package.
 *
 * - `motion-safe:` so people who ask for less motion get none. (Not a
 *   `motion-reduce:animate-none` override: `[data-entering]` is more specific and wins.)
 * - `origin-(--trigger-anchor-point)`: React Aria sets this to the point on the popup
 *   that touches its trigger (for a menu below a button, aligned to its start: the
 *   menu's top-start corner, "0px 0px"). So the menu grows out of the button, not out
 *   of its own middle.
 */
export const popoverMotion =
  'origin-(--trigger-anchor-point) motion-safe:data-entering:animate-popover-in motion-safe:data-exiting:animate-popover-out';

/** Tooltips only fade: they're small, and scaling text makes it shimmer. */
export const tooltipMotion =
  'motion-safe:data-entering:animate-tooltip-in motion-safe:data-exiting:animate-tooltip-out';
