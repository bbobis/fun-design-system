import { defaultColumnState } from './column-state';
import {
  loadColumnState,
  saveColumnState,
  storageKeyOf,
} from './column-storage';

const state = { ...defaultColumnState(['a', 'b']), widths: { a: 120 } };

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('column storage', () => {
  it('saves under a versioned key and loads it back', () => {
    saveColumnState('invoices', state);
    expect(storageKeyOf('invoices')).toBe('fds:data-grid:invoices:v1');
    expect(
      window.localStorage.getItem('fds:data-grid:invoices:v1'),
    ).toBeTruthy();
    expect(loadColumnState('invoices')).toEqual(state);
  });

  it('null forgets it', () => {
    saveColumnState('invoices', state);
    saveColumnState('invoices', null);
    expect(loadColumnState('invoices')).toBeUndefined();
  });

  it('ignores damaged or wrong-shaped saves instead of throwing', () => {
    const key = storageKeyOf('invoices');
    window.localStorage.setItem(key, '{not json');
    expect(loadColumnState('invoices')).toBeUndefined();
    window.localStorage.setItem(key, JSON.stringify({ order: 'a,b' }));
    expect(loadColumnState('invoices')).toBeUndefined();
    // Bad widths are dropped, the rest is kept.
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...state, widths: { a: 'wide', b: 90 } }),
    );
    expect(loadColumnState('invoices')?.widths).toEqual({ b: 90 });
  });

  it('blocked storage (private mode, policy) is not an error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(loadColumnState('invoices')).toBeUndefined();
    expect(() => saveColumnState('invoices', state)).not.toThrow();
  });
});
