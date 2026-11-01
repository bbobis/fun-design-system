import { cva, type VariantProps } from 'class-variance-authority';
import {
  Children,
  isValidElement,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../utils/cn';
import { Tooltip } from '../tooltip';

const avatarVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center font-medium select-none',
  {
    variants: {
      size: {
        xs: 'size-6 text-[0.625rem]',
        sm: 'size-8 text-xs',
        md: 'size-10 text-sm',
        lg: 'size-14 text-lg',
      },
      shape: {
        // People are circles; teams, companies and bots are rounded squares.
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: { size: 'md', shape: 'circle' },
  },
);

/** The initials' background. The soft tones keep text contrast in both themes. */
const tones = [
  'bg-info-soft text-on-info-soft',
  'bg-success-soft text-on-success-soft',
  'bg-warning-soft text-on-warning-soft',
  'bg-danger-soft text-on-danger-soft',
  'bg-surface text-fg',
] as const;

/**
 * The same name always gets the same tone, so a person keeps their color on every
 * page. A small string hash (djb2), not random: random would change on each render.
 */
export function toneFor(name: string): (typeof tones)[number] {
  let hash = 5381;
  for (const ch of name) hash = (hash * 33 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return tones[hash % tones.length] ?? tones[0];
}

/**
 * "Dana Smith" → "DS", "Prince" → "P", "  ana  maría  lópez " → "AL". First and last
 * word; `Array.from` splits by character, not UTF-16 unit, so "Åsa" and "😀 Bot" work.
 */
export function initialsOf(name: string, locale?: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = Array.from(words[0] ?? '')[0] ?? '';
  const last =
    words.length > 1 ? (Array.from(words.at(-1) ?? '')[0] ?? '') : '';
  return (first + last).toLocaleUpperCase(locale);
}

export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

const statusDot: Record<AvatarStatus, string> = {
  online: 'bg-success',
  away: 'bg-warning',
  busy: 'bg-danger',
  offline: 'bg-bg border-2 border-border-strong',
};
const statusText: Record<AvatarStatus, string> = {
  online: 'online',
  away: 'away',
  busy: 'busy',
  offline: 'offline',
};
const dotSize = {
  xs: 'size-2',
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-3.5',
} as const;

export type AvatarProps = Omit<ComponentProps<'span'>, 'children'> &
  VariantProps<typeof avatarVariants> & {
    /** Whose avatar: "Dana Smith". The accessible name, and the source of the initials. */
    name: string;
    /** Photo URL. Without one, or if it fails to load, the initials show. */
    src?: string;
    /**
     * A dot in the corner. Also added to the accessible name ("Dana Smith, online"),
     * because the dot's color alone doesn't reach screen readers or every eye.
     */
    status?: AvatarStatus;
    /**
     * Hide it from screen readers. Use it when the name is already printed next to the
     * avatar, so it isn't read twice ("Dana Smith Dana Smith"). @default false
     */
    decorative?: boolean;
  };

/**
 * A person (or team) as a small picture: their photo, or their initials on a color
 * picked from their name. Not interactive: put it inside a Button or link when it
 * should do something.
 *
 * Screen readers hear one image named `name` (plus the status), unless `decorative`.
 * A broken photo never shows the browser's broken-image icon: the initials are drawn
 * underneath and the photo only covers them once it has loaded.
 */
export function Avatar({
  name,
  src,
  status,
  decorative = false,
  size,
  shape,
  className,
  ...rest
}: AvatarProps) {
  // Which src failed, not just "failed": a new src gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const showPhoto = src && failedSrc !== src;
  const label = status ? `${name}, ${statusText[status]}` : name;

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={cn(avatarVariants({ size, shape }), toneFor(name), className)}
      {...rest}
    >
      <span aria-hidden="true">{initialsOf(name)}</span>
      {showPhoto && (
        <img
          src={src}
          // The span carries the name; the photo is part of that one image.
          alt=""
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
          className={cn(
            'absolute inset-0 size-full object-cover',
            shape === 'square' ? 'rounded-md' : 'rounded-full',
            // Hidden until loaded, so a slow photo shows initials, not a blank box.
            loadedSrc === src ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
      {status && (
        <span
          aria-hidden="true"
          data-status={status}
          className={cn(
            'absolute end-0 bottom-0 rounded-full ring-2 ring-bg',
            dotSize[size ?? 'md'],
            statusDot[status],
          )}
        />
      )}
    </span>
  );
}

export type AvatarGroupProps = {
  /** What the people are ("Assignees", "Viewing now"). Names the group. Required. */
  label: string;
  /** `Avatar` elements. */
  children: ReactNode;
  /**
   * Show at most this many avatars; the rest become "+N". Screen readers hear the
   * hidden names ("and 4 more: …"). @default 4
   */
  max?: number;
  /**
   * Makes "+N" a button (e.g. open the full list in a Dialog). It then also shows the
   * hidden names in a tooltip on hover and keyboard focus.
   */
  onOverflowPress?: () => void;
  /** Size of every avatar in the group (overrides theirs). @default 'md' */
  size?: VariantProps<typeof avatarVariants>['size'];
  className?: string;
};

const overlap = {
  xs: '-space-x-1.5',
  sm: '-space-x-2',
  md: '-space-x-2.5',
  lg: '-space-x-3.5',
} as const;

/**
 * A row of overlapping avatars ("who's on this"), with "+N" for the rest.
 * `role="group"` named by `label`; each avatar is still its own named image.
 */
export function AvatarGroup({
  label,
  children,
  max = 4,
  onOverflowPress,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const avatars = Children.toArray(children).filter(
    (c): c is ReactElement<AvatarProps> => isValidElement<AvatarProps>(c),
  );
  // "+1" saves no room over the avatar itself, so show it instead.
  const cut = avatars.length > max + 1 ? max : avatars.length;
  const shown = avatars.slice(0, cut);
  const hidden = avatars.slice(cut).map((a) => a.props.name);
  const s = size ?? 'md';
  const moreLabel = `and ${hidden.length} more: ${hidden.join(', ')}`;
  const chip = cn(
    avatarVariants({ size, shape: 'circle' }),
    'bg-surface text-fg ring-2 ring-bg',
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex items-center', overlap[s], className)}
    >
      {shown.map((a, i) => (
        <Avatar
          key={a.key ?? i}
          {...a.props}
          size={size}
          // The ring separates overlapping avatars on any background.
          className={cn('ring-2 ring-bg', a.props.className)}
        />
      ))}
      {hidden.length > 0 &&
        (onOverflowPress ? (
          <Tooltip content={hidden.join(', ')}>
            <button
              type="button"
              aria-label={`Show all, ${moreLabel}`}
              onClick={onOverflowPress}
              className={cn(
                chip,
                'cursor-pointer hover:bg-border',
                'outline-hidden focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus-ring',
              )}
            >
              +{hidden.length}
            </button>
          </Tooltip>
        ) : (
          <span role="img" aria-label={moreLabel} className={chip}>
            <span aria-hidden="true">+{hidden.length}</span>
          </span>
        ))}
    </div>
  );
}
