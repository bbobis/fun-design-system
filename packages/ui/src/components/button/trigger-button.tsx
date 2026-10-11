import type { VariantProps } from 'class-variance-authority';
import type { ReactNode, SVGProps } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { cn } from '../../utils/cn';
import { buttonVariants } from './button';

/** Where a Menu or Popover opens, relative to its trigger. It flips if there's no room. */
export type TriggerPlacement =
  | 'bottom start'
  | 'bottom end'
  | 'top start'
  | 'top end'
  | 'start'
  | 'end';

/** The trigger props Menu and Popover share. */
export type TriggerButtonProps = Pick<
  VariantProps<typeof buttonVariants>,
  'intent' | 'size'
> & {
  /** What the trigger button shows: text ("Filters") or an icon. */
  label: ReactNode;
  /**
   * Accessible name for the trigger. Required when `label` is only an icon;
   * otherwise the label's text is the name.
   */
  'aria-label'?: string;
  /** Show a ▾ after the label. Turn off for icon-only triggers. @default true */
  chevron?: boolean;
  /** The trigger can't be used. */
  disabled?: boolean;
  /** Classes for the trigger button. */
  className?: string;
};

/**
 * Internal: the button that opens a Menu or a Popover. It must be React Aria's Button,
 * not ours, because React Aria's triggers only wire their own (aria-expanded, open on
 * press, ↓ for menus). Same classes as Button, so it looks identical. Not exported
 * from the package.
 */
export function TriggerButton({
  label,
  'aria-label': ariaLabel,
  chevron = true,
  disabled,
  intent = 'secondary',
  size,
  className,
}: TriggerButtonProps) {
  return (
    <AriaButton
      aria-label={ariaLabel}
      isDisabled={disabled}
      className={cn(buttonVariants({ intent, size }), className)}
    >
      {label}
      {chevron && <ChevronIcon className="size-4 opacity-70" />}
    </AriaButton>
  );
}

function ChevronIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}
