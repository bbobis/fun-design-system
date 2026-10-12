/**
 * Does `file` match one of `accept`? Each entry is, like an `<input accept>`:
 * - an exact type: `application/pdf`
 * - a type family: `image/*`
 * - an extension: `.csv` (case-insensitive)
 * An empty or missing list accepts everything.
 */
export function matchesAccept(
  file: { name: string; type: string },
  accept?: readonly string[],
): boolean {
  if (!accept || accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (rule.startsWith('.')) return name.endsWith(rule);
    if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/** 1536 → "1.5 KB". Binary units, one decimal under 10, like file managers show. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit++;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value < 10 ? value.toFixed(1).replace(/\.0$/, '') : Math.round(value)} ${units[unit]}`;
}

export type RejectedFile = { name: string; reason: string };

/**
 * Splits new files into the ones to add and the ones to refuse, with a reason a person
 * can act on ("larger than 10 MB", not "error 413").
 */
export function checkFiles(
  incoming: readonly File[],
  rules: {
    accept?: readonly string[];
    maxSize?: number;
    /** Most files in total (undefined = no limit). */
    maxFiles?: number;
    /** How many files are already chosen. */
    current: number;
  },
): { accepted: File[]; rejected: RejectedFile[] } {
  const room =
    rules.maxFiles === undefined ? Infinity : rules.maxFiles - rules.current;
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  for (const file of incoming) {
    if (!matchesAccept(file, rules.accept)) {
      rejected.push({ name: file.name, reason: 'isn’t an accepted file type' });
    } else if (rules.maxSize !== undefined && file.size > rules.maxSize) {
      rejected.push({
        name: file.name,
        reason: `is larger than ${formatBytes(rules.maxSize)}`,
      });
    } else if (accepted.length >= room) {
      rejected.push({
        name: file.name,
        reason: `would go over the limit of ${rules.maxFiles} ${rules.maxFiles === 1 ? 'file' : 'files'}`,
      });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}
