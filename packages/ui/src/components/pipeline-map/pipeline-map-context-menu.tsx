import type { ReactNode, RefObject } from 'react';
import { Menu as AriaMenu, Popover } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { popoverMotion } from '../../utils/motion';

/**
 * The map's right-click / Shift+F10 menu: a React Aria `Popover` + `Menu` opened from
 * code (no trigger button), anchored to the item, or to the pointer for a right-click.
 *
 * Same look as our `Menu` (its items are our `MenuItem`s). Not exported from the
 * package: apps add items through `PipelineMap`'s `contextMenu` prop.
 */
export function MapContextMenu({
  anchorRef,
  label,
  onClose,
  children,
}: {
  /** What the menu sits next to: the item, or a 0×0 marker at the pointer. */
  anchorRef: RefObject<Element | null>;
  /** Names the menu: "Actions for Station C". */
  label: string;
  /** Called when the menu closes, for any reason (Escape, a pick, a click outside). */
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Popover
      triggerRef={anchorRef}
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      placement="bottom start"
      offset={4}
      className={cn(
        'min-w-44 rounded-md border border-border bg-bg p-1 text-fg shadow-lg outline-hidden',
        popoverMotion,
      )}
    >
      {/* autoFocus: keyboard users land on the first item, like any menu. */}
      <AriaMenu
        aria-label={label}
        autoFocus="first"
        onClose={onClose}
        className="max-h-[inherit] overflow-auto outline-hidden"
      >
        {children}
      </AriaMenu>
    </Popover>
  );
}
