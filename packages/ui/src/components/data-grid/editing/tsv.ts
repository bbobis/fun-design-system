/**
 * Tab-separated values, the format Excel and Google Sheets put on the clipboard.
 * Quoting rule (same as Excel): a cell that contains a tab, a newline or a quote is
 * wrapped in quotes, and quotes inside it are doubled. Without this, pasting
 * "Line 1⏎Line 2" into Excel would create a phantom extra row.
 */

export function toTsv(rows: readonly (readonly unknown[])[]): string {
  const quote = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[\t\n\r"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(quote).join('\t')).join('\n');
}

/** Parses clipboard text into rows of cells. Handles CRLF and Excel's trailing newline. */
export function parseTsv(text: string): string[][] {
  const src = text.replace(/\r\n?/g, '\n').replace(/\n$/, '');
  const out: string[][] = [[]];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === '')
      quoted = true; // only a leading quote opens a field
    else if (c === '\t') {
      out[out.length - 1]?.push(cell);
      cell = '';
    } else if (c === '\n') {
      out[out.length - 1]?.push(cell);
      out.push([]);
      cell = '';
    } else cell += c;
  }
  out[out.length - 1]?.push(cell);
  return out;
}
