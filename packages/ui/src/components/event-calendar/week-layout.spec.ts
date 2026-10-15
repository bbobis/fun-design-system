import { layoutDay, toMinutes, toTimed } from './week-layout';

const t = (id: string, start: string, end?: string) =>
  toTimed(id, start, end) ??
  (() => {
    throw new Error(id);
  })();
const lanes = (ids: ReturnType<typeof t>[]) =>
  Object.fromEntries(
    layoutDay(ids).map((p) => [p.item, `${p.lane}/${p.lanes}`]),
  );

describe('week-layout', () => {
  it('toMinutes reads HH:mm and rejects bad text', () => {
    expect(toMinutes('09:30')).toBe(570);
    expect(toMinutes('24:00')).toBeNull();
    expect(toMinutes('9:30')).toBeNull();
    expect(toMinutes(undefined)).toBeNull();
  });

  it('toTimed: a missing, bad or backwards end gives a 30-minute block; nothing passes midnight', () => {
    expect(t('a', '10:00')).toMatchObject({ start: 600, end: 630 });
    expect(t('a', '10:00', '09:00')).toMatchObject({ end: 630 });
    expect(t('a', '23:50')).toMatchObject({ end: 1440 });
    expect(toTimed('a', undefined, '10:00')).toBeNull();
  });

  it('events that don’t overlap each get the full width', () => {
    expect(lanes([t('a', '09:00', '10:00'), t('b', '10:00', '11:00')])).toEqual(
      {
        a: '0/1',
        b: '0/1',
      },
    );
  });

  it('a chain of overlaps is one group: all three are ½ wide (the prediction)', () => {
    // Team sync 10–11 overlaps Design review 10:30–11:30, which overlaps Planning 11–12.
    // Planning reuses Team sync's lane (it ended at 11:00), so 2 lanes are enough.
    expect(
      lanes([
        t('sync', '10:00', '11:00'),
        t('review', '10:30', '11:30'),
        t('planning', '11:00', '12:00'),
      ]),
    ).toEqual({ sync: '0/2', review: '1/2', planning: '0/2' });
  });

  it('three at once need three lanes', () => {
    expect(
      lanes([
        t('a', '09:00', '10:00'),
        t('b', '09:00', '09:30'),
        t('c', '09:15', '10:00'),
      ]),
    ).toEqual({ a: '0/3', b: '1/3', c: '2/3' });
  });
});
