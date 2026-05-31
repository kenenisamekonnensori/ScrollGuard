jest.mock('../src/db/storage', () => ({
  getValue: jest.fn(),
  setValue: jest.fn(),
}));

jest.mock('../src/native/NativeBridgeService', () => ({
  blockApp: jest.fn(),
  getNativeLockedUntil: jest.fn(),
  isAppBlocked: jest.fn(),
  unblockApp: jest.fn(),
}));

jest.mock('../src/services/NotificationService', () => ({
  sendLimitReachedNotification: jest.fn(),
  sendLockReleasedNotification: jest.fn(),
}));

const mockGetSettingsState = jest.fn();

jest.mock('../src/store/settingsStore', () => ({
  useSettingsStore: {
    getState: (...args: unknown[]) => mockGetSettingsState(...args),
  },
}));

import { getValue, setValue } from '../src/db/storage';
import {
  blockApp as nativeBlockApp,
  getNativeLockedUntil,
  isAppBlocked as nativeIsAppBlocked,
  unblockApp as nativeUnblockApp,
} from '../src/native/NativeBridgeService';
import {
  blockApp,
  clearLockSourceForAllApps,
  ensureWeeklyBlockSummary,
  enforceDailyLimitBlocks,
  getWeeklyBlockSummary,
  getResolvedAppLocks,
  reconcileExpiredLocks,
  unblockApp,
} from '../src/features/blocking/blockingController';
import { MONITORED_PACKAGE_GROUPS, MONITORED_PACKAGES } from '../src/utils/appPackages';

const mockedGetValue = jest.mocked(getValue);
const mockedSetValue = jest.mocked(setValue);
const mockedGetNativeLockedUntil = jest.mocked(getNativeLockedUntil);
const mockedNativeIsAppBlocked = jest.mocked(nativeIsAppBlocked);
const mockedNativeUnblockApp = jest.mocked(nativeUnblockApp);
const mockedNativeBlockApp = jest.mocked(nativeBlockApp);

describe('blockingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetValue.mockReturnValue({});
    mockedGetNativeLockedUntil.mockResolvedValue(null);
    mockedNativeIsAppBlocked.mockResolvedValue(false);
    mockedNativeUnblockApp.mockResolvedValue(undefined);
    mockedNativeBlockApp.mockResolvedValue(undefined);
    mockGetSettingsState.mockReturnValue({
      userSettings: {
        tiktokLimitMinutes: 20,
        instagramLimitMinutes: 15,
        youtubeLimitMinutes: 15,
        lockDurationMinutes: 30,
        dailyLimitEnabled: false,
      },
    });
  });

  test('resolves native lock expiry for focus/settings surfaces', async () => {
    mockedGetNativeLockedUntil.mockImplementation(async packageName => {
      return packageName === 'com.instagram.lite' ? Date.now() + 60_000 : null;
    });

    const activeLocks = await getResolvedAppLocks();

    expect(activeLocks).toEqual([
      expect.objectContaining({
        packageName: MONITORED_PACKAGES.instagram,
        packageNames: MONITORED_PACKAGE_GROUPS.instagram,
        lockedUntil: expect.any(Number),
        source: 'native',
      }),
    ]);
  });

  test('prefers persisted local lock expiry when available', async () => {
    mockedGetValue.mockImplementation(key => {
      if (key === 'lockStates') {
        return {
          [MONITORED_PACKAGES.instagram]: { focus: Date.now() + 30_000 },
        };
      }

      return {};
    });

    const activeLocks = await getResolvedAppLocks();

    expect(activeLocks[0]).toEqual(
      expect.objectContaining({
        packageName: MONITORED_PACKAGES.instagram,
        source: 'local',
      }),
    );
    expect(typeof activeLocks[0]?.lockedUntil).toBe('number');
  });

  test('unblockApp keeps remaining lock sources active', async () => {
    mockedGetValue.mockImplementation(key => {
      if (key === 'lockStates') {
        return {
          [MONITORED_PACKAGES.instagram]: {
            focus: Date.now() + 30_000,
            dailyLimit: Date.now() + 60_000,
          },
        };
      }

      return {};
    });

    await unblockApp(MONITORED_PACKAGES.instagram, 'focus');

    expect(mockedNativeBlockApp).toHaveBeenCalledWith(MONITORED_PACKAGES.instagram, 1);
    expect(mockedNativeUnblockApp).not.toHaveBeenCalledWith(MONITORED_PACKAGES.instagram);
  });

  test('enforces daily limits only when the mode is active', async () => {
    mockGetSettingsState.mockReturnValue({
      userSettings: {
        tiktokLimitMinutes: 20,
        instagramLimitMinutes: 15,
        youtubeLimitMinutes: 15,
        lockDurationMinutes: 30,
        dailyLimitEnabled: true,
      },
    });

    await enforceDailyLimitBlocks({
      [MONITORED_PACKAGES.instagram]: 16 * 60,
      [MONITORED_PACKAGES.tiktok]: 0,
      [MONITORED_PACKAGES.youtube]: 0,
    });

    expect(mockedNativeBlockApp).toHaveBeenCalledWith(MONITORED_PACKAGE_GROUPS.instagram[0], 30);
    expect(mockedNativeBlockApp).toHaveBeenCalledWith(MONITORED_PACKAGE_GROUPS.instagram[1], 30);
  });

  test('clearLockSourceForAllApps removes a source from every monitored package', async () => {
    mockedGetValue.mockImplementation(key => {
      if (key === 'lockStates') {
        return {
          [MONITORED_PACKAGES.instagram]: {
            focus: Date.now() + 30_000,
            dailyLimit: Date.now() + 60_000,
          },
          [MONITORED_PACKAGES.tiktok]: {
            dailyLimit: Date.now() + 45_000,
          },
        };
      }

      return {};
    });

    await clearLockSourceForAllApps('dailyLimit');

    expect(mockedNativeBlockApp).toHaveBeenCalledWith(MONITORED_PACKAGES.instagram, 1);
    expect(mockedNativeUnblockApp).toHaveBeenCalledWith(MONITORED_PACKAGES.tiktok);
  });

  test('reconcileExpiredLocks only syncs native state for local lock entries', async () => {
    mockedGetValue.mockImplementation(key => {
      if (key === 'lockStates') {
        return {};
      }

      return {};
    });

    await reconcileExpiredLocks();

    expect(mockedNativeUnblockApp).not.toHaveBeenCalled();
  });

  test('reconcileExpiredLocks keeps active local locks synced to native state', async () => {
    const now = Date.now();

    mockedGetValue.mockImplementation(key => {
      if (key === 'lockStates') {
        return {
          [MONITORED_PACKAGES.instagram]: {
            focus: now + 60_000,
          },
        };
      }

      return {};
    });

    await reconcileExpiredLocks();

    expect(mockedNativeBlockApp).toHaveBeenCalledWith(MONITORED_PACKAGES.instagram, 1);
    expect(mockedNativeUnblockApp).not.toHaveBeenCalledWith(MONITORED_PACKAGES.instagram);
  });

  describe('weekly block summary', () => {
    function getLocalDateKey(date: Date): string {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function getWeekStartKey(date: Date): string {
      const startOfWeek = new Date(date);
      startOfWeek.setHours(0, 0, 0, 0);
      const dayIndex = startOfWeek.getDay();
      const diff = (dayIndex + 6) % 7; // Monday as week start
      startOfWeek.setDate(startOfWeek.getDate() - diff);
      return getLocalDateKey(startOfWeek);
    }

    function setupStore(initial: Record<string, unknown> = {}): Record<string, unknown> {
      const store = { ...initial };
      mockedGetValue.mockImplementation(key => store[key as string]);
      mockedSetValue.mockImplementation((key, value) => {
        store[key as string] = value;
      });
      return store;
    }

    afterEach(() => {
      jest.useRealTimers();
    });

    test('rebuilds missing weekly summary from history and persists on ensure', () => {
      const now = new Date(2026, 4, 27, 12, 0, 0);
      jest.useFakeTimers().setSystemTime(now);

      const createdAtFirst = new Date(2026, 4, 25, 9, 30, 0).getTime();
      const createdAtSecond = new Date(2026, 4, 26, 14, 0, 0).getTime();

      const store = setupStore({
        blockHistory: [
          {
            id: `first-${createdAtFirst}`,
            app: MONITORED_PACKAGES.tiktok,
            source: 'focus',
            durationMinutes: 15,
            createdAt: createdAtFirst,
          },
          {
            id: `second-${createdAtSecond}`,
            app: MONITORED_PACKAGES.instagram,
            source: 'dailyLimit',
            durationMinutes: 10,
            createdAt: createdAtSecond,
          },
        ],
      });

      const summary = getWeeklyBlockSummary();

      expect(summary.weekStart).toBe(getWeekStartKey(now));
      expect(summary.totalMinutes).toBe(25);
      expect(summary.perAppMinutes).toEqual({
        [MONITORED_PACKAGES.tiktok]: 15,
        [MONITORED_PACKAGES.instagram]: 10,
      });

      const ensuredSummary = ensureWeeklyBlockSummary();

      expect(ensuredSummary.totalMinutes).toBe(25);
      expect(store['weeklyBlockSummary.v1']).toEqual(ensuredSummary);
      expect(mockedSetValue).toHaveBeenCalledWith('weeklyBlockSummary.v1', ensuredSummary);
    });

    test('increments weekly summary for same-week blocks', async () => {
      const now = new Date(2026, 4, 28, 10, 0, 0);
      jest.useFakeTimers().setSystemTime(now);

      const weekStartKey = getWeekStartKey(now);
      const store = setupStore({
        'weeklyBlockSummary.v1': {
          weekStart: weekStartKey,
          updatedAt: now.getTime(),
          totalMinutes: 5,
          perAppMinutes: {
            [MONITORED_PACKAGES.instagram]: 5,
          },
          daily: {
            [getLocalDateKey(now)]: {
              totalMinutes: 5,
              perAppMinutes: {
                [MONITORED_PACKAGES.instagram]: 5,
              },
            },
          },
        },
        blockHistory: [],
      });

      await blockApp(MONITORED_PACKAGES.instagram, 10, 'focus');

      const summary = store['weeklyBlockSummary.v1'] as {
        totalMinutes: number;
        perAppMinutes: Record<string, number>;
        daily: Record<string, { totalMinutes: number; perAppMinutes: Record<string, number> }>;
      };

      expect(summary.totalMinutes).toBe(15);
      expect(summary.perAppMinutes[MONITORED_PACKAGES.instagram]).toBe(15);
      expect(summary.daily[getLocalDateKey(now)]?.totalMinutes).toBe(15);
    });

    test('excludes blocks outside the current week boundary', () => {
      const now = new Date(2026, 4, 27, 8, 0, 0);
      jest.useFakeTimers().setSystemTime(now);

      const previousWeekItem = new Date(2026, 4, 24, 23, 59, 0).getTime();
      const weekStartItem = new Date(2026, 4, 25, 0, 0, 0).getTime();

      setupStore({
        blockHistory: [
          {
            id: `previous-${previousWeekItem}`,
            app: MONITORED_PACKAGES.youtube,
            source: 'focus',
            durationMinutes: 20,
            createdAt: previousWeekItem,
          },
          {
            id: `current-${weekStartItem}`,
            app: MONITORED_PACKAGES.youtube,
            source: 'focus',
            durationMinutes: 8,
            createdAt: weekStartItem,
          },
        ],
      });

      const summary = getWeeklyBlockSummary();

      expect(summary.totalMinutes).toBe(8);
      expect(summary.perAppMinutes[MONITORED_PACKAGES.youtube]).toBe(8);
    });

    test('replaces invalid persisted summaries', () => {
      const now = new Date(2026, 4, 27, 8, 0, 0);
      jest.useFakeTimers().setSystemTime(now);

      const store = setupStore({
        'weeklyBlockSummary.v1': {
          weekStart: 'bad-date',
          updatedAt: 'yesterday',
          totalMinutes: -5,
          perAppMinutes: {
            [MONITORED_PACKAGES.tiktok]: -10,
          },
          daily: {},
        },
        blockHistory: [
          {
            id: `current-${now.getTime()}`,
            app: MONITORED_PACKAGES.tiktok,
            source: 'focus',
            durationMinutes: 12,
            createdAt: now.getTime(),
          },
        ],
      });

      const ensured = ensureWeeklyBlockSummary();

      expect(ensured.weekStart).toBe(getWeekStartKey(now));
      expect(ensured.totalMinutes).toBe(12);
      expect(store['weeklyBlockSummary.v1']).toEqual(ensured);
    });
  });
});
