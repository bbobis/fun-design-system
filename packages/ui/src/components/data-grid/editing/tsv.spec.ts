import { parseTsv, toTsv } from './tsv';

describe('TSV (Excel clipboard format)', () => {
  it('joins cells with tabs and rows with newlines', () => {
    expect(
      toTsv([
        ['a', 1],
        [null, 'b'],
      ]),
    ).toBe('a\t1\n\tb');
  });

  it('quotes cells containing tabs, newlines or quotes', () => {
    expect(toTsv([['say "hi"', 'x\ty', 'l1\nl2']])).toBe(
      '"say ""hi"""\t"x\ty"\t"l1\nl2"',
    );
  });

  it('parses what Excel puts on the clipboard (CRLF + trailing newline)', () => {
    expect(parseTsv('Acme\t12\r\nGlobex\t7\r\n')).toEqual([
      ['Acme', '12'],
      ['Globex', '7'],
    ]);
  });

  it('keeps empty cells', () => {
    expect(parseTsv('a\t\tc\n\t\t')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
  });

  it('round-trips awkward values', () => {
    const rows = [
      ['say "hi"', 'x\ty', 'l1\nl2'],
      ['', 'plain', '"'],
    ];
    expect(parseTsv(toTsv(rows))).toEqual(rows);
  });

  it('a quote in the middle of a cell is just a character', () => {
    expect(parseTsv('5" pipe\tok')).toEqual([['5" pipe', 'ok']]);
  });
});
