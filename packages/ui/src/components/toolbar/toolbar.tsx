import { createContext, useContext, type ReactNode } from 'react';
import {
  Group,
  Separator,
  Toolbar as AriaToolbar,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

/** The toolbar's direction, for its separators (React Aria doesn't pass it to them). */
const ToolbarOrientation = createContext<'horizontal' | 'vertical'>(
  'horizontal',
);

export type ToolbarProps = {
  /** What the controls act on ("Invoice actions", "Text formatting"). Required. */
  'aria-label': string;
  /** Our controls: Button, Menu, icon Buttons with Tooltip, ToolbarGroup, ToolbarSeparator. */
  children: ReactNode;
  /** @default 'horizontal' (←/→ move); 'vertical' uses ↑/↓ */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

/**
 * A row of controls that counts as **one Tab stop**: Tab enters on the last control
 * you used, ←/→ move between controls, Tab leaves.
 * Built on React Aria `Toolbar` (`role="toolbar"`).
 *
 * Use it when a group of 4+ related actions sits before content people Tab to (a
 * table, an editor), so keyboard users don't Tab through every button each time.
 * For 2–3 buttons, a plain row is simpler.
 *
 * Don't put controls that use the arrow keys themselves inside it (a text input, a
 * SegmentedControl, a Slider): the toolbar and the control would fight over ←/→.
 * In a vertical toolbar, give tooltips `placement="end"` so they don't cover the
 * neighbouring buttons.
 *
 * @example
 * <Toolbar aria-label="Invoice actions">
 *   <Button intent="secondary">New</Button>
 *   <ToolbarSeparator />
 *   <Menu label="Export">…</Menu>
 * </Toolbar>
 */
export function Toolbar({
  'aria-label': ariaLabel,
  children,
  orientation = 'horizontal',
  className,
}: ToolbarProps) {
  return (
    <AriaToolbar
      aria-label={ariaLabel}
      orientation={orientation}
      className={cn(
        'flex gap-1',
        orientation === 'horizontal'
          ? 'flex-row flex-wrap items-center'
          : 'flex-col items-stretch',
        className,
      )}
    >
      <ToolbarOrientation.Provider value={orientation}>
        {children}
      </ToolbarOrientation.Provider>
    </AriaToolbar>
  );
}

export type ToolbarGroupProps = {
  /** Names the group for screen readers ("Text style"). */
  'aria-label': string;
  children: ReactNode;
  className?: string;
};

/** Related controls inside a Toolbar, read out as one named group. Arrows still move through them. */
export function ToolbarGroup({
  'aria-label': ariaLabel,
  children,
  className,
}: ToolbarGroupProps) {
  const vertical = useContext(ToolbarOrientation) === 'vertical';
  return (
    <Group
      aria-label={ariaLabel}
      className={cn('flex gap-1', vertical && 'flex-col', className)}
    >
      {children}
    </Group>
  );
}

/**
 * A divider between groups of controls. It runs across the toolbar's direction (a
 * vertical line in a horizontal toolbar) and says so to screen readers.
 */
export function ToolbarSeparator() {
  const vertical = useContext(ToolbarOrientation) === 'horizontal';
  return (
    <Separator
      orientation={vertical ? 'vertical' : 'horizontal'}
      className={cn(
        'shrink-0 border-0 bg-border-strong',
        vertical ? 'mx-1 h-6 w-px self-center' : 'my-1 h-px self-stretch',
      )}
    />
  );
}
