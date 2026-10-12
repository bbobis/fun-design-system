import { parseDate } from '@internationalized/date';
import { commonRangePresets } from './range-presets';

const byLabel = (today: string) =>
  Object.fromEntries(
    commonRangePresets(parseDate(today)).map((p) => [p.label, p.value]),
  );

describe('commonRangePresets', () => {
  it('counts both ends: "Last 7 days" on Mon Oct 12 is Oct 6 – Oct 12', () => {
    const p = byLabel('2026-10-12');
    expect(p['Today']).toEqual({ start: '2026-10-12', end: '2026-10-12' });
    expect(p['Last 7 days']).toEqual({
      start: '2026-10-06',
      end: '2026-10-12',
    });
    expect(p['Last 30 days']).toEqual({
      start: '2026-09-13',
      end: '2026-10-12',
    });
    expect(p['Month to date']).toEqual({
      start: '2026-10-01',
      end: '2026-10-12',
    });
    expect(p['Last month']).toEqual({ start: '2026-09-01', end: '2026-09-30' });
    expect(p['Year to date']).toEqual({
      start: '2026-01-01',
      end: '2026-10-12',
    });
  });

  it('crosses month and year edges, including a leap day', () => {
    const jan = byLabel('2027-01-03');
    expect(jan['Last 7 days']).toEqual({
      start: '2026-12-28',
      end: '2027-01-03',
    });
    expect(jan['Last month']).toEqual({
      start: '2026-12-01',
      end: '2026-12-31',
    });
    const mar = byLabel('2028-03-02');
    expect(mar['Last 7 days']).toEqual({
      start: '2028-02-25',
      end: '2028-03-02',
    });
    expect(mar['Last month']).toEqual({
      start: '2028-02-01',
      end: '2028-02-29',
    });
  });
});
