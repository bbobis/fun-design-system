/**
 * Test-only setup, run by Vitest before every spec file (vite.config.mts → setupFiles).
 * Fills gaps in jsdom that every real browser has. Not part of the published library.
 */

// React Aria uses CSS.escape to build selectors; jsdom doesn't implement it.
globalThis.CSS ??= {} as typeof CSS;
CSS.escape ??= (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
