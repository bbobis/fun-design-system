import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import {
  contrastRatio,
  parseColor,
  wcagLevel,
  type Rgb,
} from '../utils/contrast';

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

/**
 * Every value on this page is read from the compiled CSS at runtime, so it can't drift
 * from tokens.css. Flip the theme in the toolbar and the numbers update.
 */

const SCALES = [
  'yellow',
  'clementine',
  'cherry',
  'leaf',
  'sky',
  'gray',
] as const;
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

/**
 * Semantic pairs: a background token and the text token meant to go on it.
 * The class names are written out in full on purpose. Tailwind only generates a class it
 * can see as a literal string in the source, so `bg-${name}` would produce nothing.
 */
const PAIRS = [
  {
    bg: 'primary',
    fg: 'on-primary',
    bgClass: 'bg-primary',
    fgClass: 'text-on-primary',
  },
  {
    bg: 'primary-hover',
    fg: 'on-primary',
    bgClass: 'bg-primary-hover',
    fgClass: 'text-on-primary',
  },
  {
    bg: 'secondary',
    fg: 'on-secondary',
    bgClass: 'bg-secondary',
    fgClass: 'text-on-secondary',
  },
  {
    bg: 'secondary-hover',
    fg: 'on-secondary',
    bgClass: 'bg-secondary-hover',
    fgClass: 'text-on-secondary',
  },
  {
    bg: 'warning',
    fg: 'on-warning',
    bgClass: 'bg-warning',
    fgClass: 'text-on-warning',
  },
  {
    bg: 'danger',
    fg: 'on-danger',
    bgClass: 'bg-danger',
    fgClass: 'text-on-danger',
  },
  {
    bg: 'success',
    fg: 'on-success',
    bgClass: 'bg-success',
    fgClass: 'text-on-success',
  },
  { bg: 'info', fg: 'on-info', bgClass: 'bg-info', fgClass: 'text-on-info' },
  {
    bg: 'warning-soft',
    fg: 'on-warning-soft',
    bgClass: 'bg-warning-soft',
    fgClass: 'text-on-warning-soft',
  },
  {
    bg: 'danger-soft',
    fg: 'on-danger-soft',
    bgClass: 'bg-danger-soft',
    fgClass: 'text-on-danger-soft',
  },
  {
    bg: 'success-soft',
    fg: 'on-success-soft',
    bgClass: 'bg-success-soft',
    fgClass: 'text-on-success-soft',
  },
  {
    bg: 'info-soft',
    fg: 'on-info-soft',
    bgClass: 'bg-info-soft',
    fgClass: 'text-on-info-soft',
  },
  { bg: 'bg', fg: 'fg', bgClass: 'bg-bg', fgClass: 'text-fg' },
  { bg: 'bg', fg: 'fg-muted', bgClass: 'bg-bg', fgClass: 'text-fg-muted' },
  { bg: 'surface', fg: 'fg', bgClass: 'bg-surface', fgClass: 'text-fg' },
  {
    bg: 'surface',
    fg: 'fg-muted',
    bgClass: 'bg-surface',
    fgClass: 'text-fg-muted',
  },
  { bg: 'bg', fg: 'link', bgClass: 'bg-bg', fgClass: 'text-link' },
] as const;

/** Non-text pairs: WCAG asks for 3:1 for these, not 4.5:1. */
const UI_PAIRS = [
  {
    bg: 'bg',
    fg: 'border',
    bgClass: 'bg-bg',
    fgClass: 'border-border',
    minimum: null,
  },
  {
    bg: 'bg',
    fg: 'border-strong',
    bgClass: 'bg-bg',
    fgClass: 'border-border-strong',
    minimum: 3,
  },
  {
    bg: 'bg',
    fg: 'focus-ring',
    bgClass: 'bg-bg',
    fgClass: 'ring-focus-ring',
    minimum: 3,
  },
  {
    bg: 'bg',
    fg: 'link-underline',
    bgClass: 'bg-bg',
    fgClass: 'decoration-link-underline',
    minimum: 3,
  },
] as const;

/** Formats an RGB triple as 6-digit hex, since the CSS build may shorten `#ff8833` to `#f83`. */
function toHex([r, g, b]: Rgb): string {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** Reads a `--color-*` token from the root element, resolved to its current hex. */
function readToken(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--color-${name}`)
    .trim();
}

/** Re-renders whenever `data-theme` on <html> changes, so the toolbar toggle updates the numbers. */
function useThemeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((v) => v + 1));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return version;
}

function Ratio({
  bg,
  fg,
  minimum,
}: {
  bg: string;
  fg: string;
  /** WCAG minimum for this pair, or null for decorative elements with no requirement. */
  minimum: 3 | 4.5 | null;
}) {
  const a = parseColor(readToken(bg));
  const b = parseColor(readToken(fg));
  // A pill on the page background, so the number is readable on any tile color.
  const pill =
    'w-fit rounded bg-bg px-1.5 py-0.5 font-mono text-xs text-fg tabular-nums';
  if (!a || !b) return <span className={pill}>unreadable</span>;
  const ratio = contrastRatio(a, b);
  if (minimum === null)
    return <span className={pill}>{ratio.toFixed(1)}:1 decorative</span>;
  const pass = ratio >= minimum;
  return (
    <span className={pill}>
      {ratio.toFixed(1)}:1 {pass ? '✓' : '✗'} {wcagLevel(ratio)}
    </span>
  );
}

function TokenSheet() {
  useThemeVersion();
  const theme = document.documentElement.dataset.theme ?? 'light';

  return (
    <div className="flex max-w-5xl flex-col gap-10 font-sans text-fg">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Tokens</h1>
        <p className="text-fg-muted">
          Current theme: <span className="font-mono">{theme}</span>. Use the
          toolbar to switch. Text needs 4.5:1; outlines and rings need 3:1;
          decorative dividers have no minimum.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Semantic: text on background</h2>
        <p className="text-sm text-fg-muted">
          What components use. Each tile is{' '}
          <span className="font-mono">bg-X</span> with{' '}
          <span className="font-mono">text-on-X</span>.
        </p>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
          {PAIRS.map((p) => (
            <li
              key={`${p.bg}/${p.fg}`}
              className={`flex flex-col gap-1 rounded-md border border-border px-3 py-2 ${p.bgClass} ${p.fgClass}`}
            >
              <span className="font-medium">
                {p.fg} on {p.bg}
              </span>
              <Ratio bg={p.bg} fg={p.fg} minimum={4.5} />
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Semantic: borders and rings</h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
          {UI_PAIRS.map((p) => (
            <li
              key={p.fg}
              className="flex items-center gap-3 rounded-md border border-border bg-bg px-3 py-2"
            >
              <span
                className={`inline-block h-6 w-6 rounded border-4 ${p.fgClass} ${
                  p.fg === 'focus-ring'
                    ? 'ring-4 border-transparent'
                    : p.fg === 'link-underline'
                      ? 'border-transparent underline decoration-4'
                      : ''
                }`}
                aria-hidden="true"
              >
                {p.fg === 'link-underline' ? 'Aa' : ''}
              </span>
              <span className="flex flex-col">
                <span className="font-medium">{p.fg}</span>
                <Ratio bg={p.bg} fg={p.fg} minimum={p.minimum} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Primitives</h2>
        <p className="text-sm text-fg-muted">
          Raw brand scales. Components never use these directly. The ratio is
          against white text.
        </p>
        {SCALES.map((scale) => (
          <div
            key={scale}
            className="grid grid-cols-[6rem_1fr] items-center gap-2"
          >
            <span className="font-mono text-sm">{scale}</span>
            <ul className="grid grid-cols-5 gap-1 sm:grid-cols-10">
              {STEPS.map((step) => (
                <Swatch key={step} scale={scale} step={step} />
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function Swatch({
  scale,
  step,
}: {
  scale: (typeof SCALES)[number];
  step: (typeof STEPS)[number];
}) {
  const hex = readToken(`${scale}-${step}`);
  const rgb = parseColor(hex);
  const onWhite = rgb ? contrastRatio(rgb, WHITE) : 0;
  const darkText = rgb ? contrastRatio(rgb, BLACK) > onWhite : false;
  return (
    <li
      className={`flex min-w-0 flex-col rounded px-1.5 py-1 font-mono text-[10px] leading-tight bg-${scale}-${step} ${
        darkText ? 'text-black' : 'text-white'
      }`}
      title={`${scale}-${step} ${hex}`}
    >
      <span className="font-semibold">{step}</span>
      <span className="truncate">{rgb ? toHex(rgb) : hex}</span>
      <span className="tabular-nums">w {onWhite.toFixed(1)}</span>
    </li>
  );
}

const meta = {
  title: 'Foundations/Tokens',
  component: TokenSheet,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TokenSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTokens: Story = {};
