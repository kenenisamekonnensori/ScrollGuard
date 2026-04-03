import { __usageStoreInternals } from '../src/store/usageStore';

jest.mock('react-native-mmkv', () => {
  class MMKVStorage {
    private store = new Map<string, string>();

    set(key: string, value: string | number | boolean): void {
      this.store.set(key, String(value));
    }

    getString(key: string): string | undefined {
      return this.store.get(key);
    }

    getNumber(key: string): number | undefined {
      const value = this.store.get(key);
      if (value === undefined || Number.isNaN(Number(value))) {
        return undefined;
      }

      return Number(value);
    }

    getBoolean(key: string): boolean | undefined {
      const value = this.store.get(key);
      if (value === undefined) {
        return undefined;
      }

      if (value === 'true') {
        return true;
      }

      if (value === 'false') {
        return false;
      }

      return undefined;
    }

    contains(key: string): boolean {
      return this.store.has(key);
    }

    remove(key: string): void {
      this.store.delete(key);
    }
  }

  return {
    createMMKV: () => new MMKVStorage(),
  };
});

describe('usageStore daily history helpers', () => {
  test('retains at most 7 days and keeps newest snapshots', () => {
    const history: any[] = [];

    for (let day = 1; day <= 8; day += 1) {
      const dateKey = `2026-03-${`${day}`.padStart(2, '0')}`;
      const updated = __usageStoreInternals.buildUpdatedHistory(
        history,
        { 'com.test.app': day * 60 },
        { 'com.test.app': day },
        dateKey,
      );

      history.splice(0, history.length, ...updated);
    }

    expect(history).toHaveLength(7);
    expect(history[0].date).toBe('2026-03-02');
    expect(history[history.length - 1].date).toBe('2026-03-08');
  });

  test('upserts existing day instead of duplicating same date', () => {
    const dayKey = '2026-03-12';
    const first = __usageStoreInternals.buildUpdatedHistory(
      [],
      { 'com.test.app': 120 },
      { 'com.test.app': 4 },
      dayKey,
    );

    const second = __usageStoreInternals.buildUpdatedHistory(
      first,
      { 'com.test.app': 300 },
      { 'com.test.app': 9 },
      dayKey,
    );

    expect(second).toHaveLength(1);
    expect(second[0].date).toBe(dayKey);
    expect(second[0].totalSeconds).toBe(300);
    expect(second[0].totalVideos).toBe(9);
  });

  test('sanitizes persisted snapshots with invalid schema values', () => {
    const sanitized = __usageStoreInternals.sanitizeDailyHistory([
      {
        date: '2026-03-10',
        usageStats: {
          valid: 121.9,
          invalid: -3,
        },
        videoCounts: {
          videos: 5.7,
        },
        totalSeconds: -999,
        totalVideos: 0,
      },
      {
        date: 'bad-date',
        usageStats: { ignored: 10 },
        videoCounts: { ignored: 1 },
      },
      null,
    ]);

    expect(sanitized).toHaveLength(1);
    expect(sanitized[0].date).toBe('2026-03-10');
    expect(sanitized[0].usageStats.valid).toBe(121);
    expect(sanitized[0].usageStats.invalid).toBe(0);
    expect(sanitized[0].videoCounts.videos).toBe(5);
    // Falls back to calculated totals when provided totals are invalid/non-positive.
    expect(sanitized[0].totalSeconds).toBe(121);
    expect(sanitized[0].totalVideos).toBe(5);
  });
});
