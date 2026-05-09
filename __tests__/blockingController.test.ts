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
  sendLockReleasedNotification: jest.fn(),
}));

import { getValue } from '../src/db/storage';
import {
  getNativeLockedUntil,
  isAppBlocked as nativeIsAppBlocked,
  unblockApp as nativeUnblockApp,
} from '../src/native/NativeBridgeService';
import {
  getResolvedAppLocks,
  unblockAppFamily,
} from '../src/features/blocking/blockingController';
import { MONITORED_PACKAGE_GROUPS, MONITORED_PACKAGES } from '../src/utils/appPackages';

const mockedGetValue = jest.mocked(getValue);
const mockedGetNativeLockedUntil = jest.mocked(getNativeLockedUntil);
const mockedNativeIsAppBlocked = jest.mocked(nativeIsAppBlocked);
const mockedNativeUnblockApp = jest.mocked(nativeUnblockApp);

describe('blockingController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetValue.mockReturnValue({});
    mockedGetNativeLockedUntil.mockResolvedValue(null);
    mockedNativeIsAppBlocked.mockResolvedValue(false);
    mockedNativeUnblockApp.mockResolvedValue(undefined);
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
          [MONITORED_PACKAGES.instagram]: Date.now() + 30_000,
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

  test('unblockAppFamily clears canonical package and aliases', async () => {
    await unblockAppFamily(MONITORED_PACKAGES.instagram);

    expect(mockedNativeUnblockApp).toHaveBeenCalledTimes(MONITORED_PACKAGE_GROUPS.instagram.length);
    expect(mockedNativeUnblockApp).toHaveBeenCalledWith(MONITORED_PACKAGE_GROUPS.instagram[0]);
    expect(mockedNativeUnblockApp).toHaveBeenCalledWith(MONITORED_PACKAGE_GROUPS.instagram[1]);
  });
});
