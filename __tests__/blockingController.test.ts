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

import { getValue } from '../src/db/storage';
import {
  blockApp as nativeBlockApp,
  getNativeLockedUntil,
  isAppBlocked as nativeIsAppBlocked,
  unblockApp as nativeUnblockApp,
} from '../src/native/NativeBridgeService';
import {
  clearLockSourceForAllApps,
  enforceDailyLimitBlocks,
  getResolvedAppLocks,
  reconcileExpiredLocks,
  unblockApp,
} from '../src/features/blocking/blockingController';
import { MONITORED_PACKAGE_GROUPS, MONITORED_PACKAGES } from '../src/utils/appPackages';

const mockedGetValue = jest.mocked(getValue);
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
});
