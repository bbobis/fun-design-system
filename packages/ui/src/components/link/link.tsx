import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode, SVGProps } from 'react';
import {
  Link as AriaLink,
  RouterProvider as AriaRouterProvider,
} from 'react-aria-components';
import { cn } from '../../utils/cn';

const linkVariants = cva(
  [
    'rounded-sm text-link',
    'outline-hidden data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-solid data-focus-visible:outline-focus-ring',
  ],
  {
    variants: {
      variant: {
        // In a sentence the underline is what says "link"; color alone isn't enough
        // (WCAG 1.4.1), so it's always there and gets thicker on hover.
        inline:
          'underline decoration-link-underline decoration-1 underline-offset-4 data-hovered:decoration-2',
        // On its own line ("View all invoices") the layout already says "link".
        standalone:
          'inline-flex items-center gap-1 font-medium no-underline decoration-link-underline decoration-2 underline-offset-4 data-hovered:underline',
      },
    },
    defaultVariants: { variant: 'inline' },
  },
);

export type LinkProps = VariantProps<typeof linkVariants> & {
  /**
   * Where it goes. Required: something that runs code instead of going somewhere is a
   * Button. With a `RouterProvider`, app paths ("/invoices") navigate without a reload.
   */
  href: string;
  children: ReactNode;
  /**
   * Opens in a new tab (`target="_blank"`, `rel="noopener noreferrer"`), with an ↗ icon
   * and ", opens in a new tab" for screen readers. Set it yourself: a full URL isn't
   * always another site. @default false
   */
  external?: boolean;
  /** Offer the target as a download (optionally with this file name). */
  download?: boolean | string;
  /** For the link to the page you're on (in a nav): `"page"`. */
  'aria-current'?: 'page' | 'step' | 'location' | 'true';
  /** Only when the visible text isn't enough on its own ("Edit" → "Edit invoice INV-2041"). */
  'aria-label'?: string;
  id?: string;
  className?: string;
};

/**
 * Goes somewhere: another page, a section, a file, another site. A real `<a>`, so
 * middle-click, "copy link" and "open in new tab" work. For an action (save, open a
 * dialog), use Button.
 *
 * Built on React Aria `Link`: Enter follows it, the focus ring is keyboard-only, and
 * inside a `RouterProvider` app paths go through your router.
 *
 * There's no `disabled`: a link that goes nowhere is confusing. Show plain text instead.
 */
export function Link({
  href,
  children,
  variant,
  external = false,
  download,
  className,
  ...rest
}: LinkProps) {
  return (
    <AriaLink
      href={href}
      target={external ? '_blank' : undefined}
      // noopener: the new tab can't reach back into this one (window.opener).
      // noreferrer: it isn't told which page linked to it.
      rel={external ? 'noopener noreferrer' : undefined}
      download={download}
      className={cn(linkVariants({ variant }), className)}
      {...rest}
    >
      {children}
      {external && (
        <>
          {/* Part of the link's name, so it's read with it, but not shown. Starts
              with a comma, not a space: name computation trims a leading space, and
              "Docs(opens…" would run the words together. */}
          <span className="sr-only">, opens in a new tab</span>
          <ExternalIcon className="ms-0.5 inline size-[0.85em] align-baseline rtl:-scale-x-100" />
        </>
      )}
    </AriaLink>
  );
}

export type RouterProviderProps = {
  /** Your router's navigate function: React Router's `useNavigate()`, Next's `router.push`. */
  navigate: (path: string) => void;
  /**
   * Turns a route into a real URL for the `<a href>` (needed when your router adds a
   * base path). React Router: `useHref`. Leave it out otherwise.
   */
  useHref?: (href: string) => string;
  children: ReactNode;
};

/**
 * Wrap the app once, and every Link, Breadcrumb, SideNavItem and Menu link with an app
 * path navigates through your router instead of reloading the page. Links to other
 * sites, `external` links and modified clicks (Ctrl/⌘/middle-click) still work like
 * normal links. Ours, so apps never import React Aria (component-recipe rule 17).
 */
export function RouterProvider({
  navigate,
  useHref,
  children,
}: RouterProviderProps) {
  return (
    <AriaRouterProvider navigate={navigate} useHref={useHref}>
      {children}
    </AriaRouterProvider>
  );
}

function ExternalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6.5 3.5h-3v9h9v-3M9.5 2.5h4v4M13.5 2.5 7.5 8.5" />
    </svg>
  );
}
