import {
  hasCompletedOnboarding,
  getLastActiveAt,
  RECENT_INACTIVITY_THRESHOLD_MS,
  resolveProtectedEntryRoute,
  resolveStartupRoute,
  setLastActiveAt,
  setOnboardingCompleted,
  shouldShowSplashAfterInactivity,
} from '../src/utils/appFlow';
import { getPermissionSnapshot } from '../src/native/NativeBridgeService';

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

jest.mock('../src/native/NativeBridgeService', () => ({
  getPermissionSnapshot: jest.fn(),
}));

describe('appFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setOnboardingCompleted(false);
  });

  test('tracks onboarding completion in storage', () => {
    expect(hasCompletedOnboarding()).toBe(false);
    setOnboardingCompleted(true);
    expect(hasCompletedOnboarding()).toBe(true);
  });

  test('detects users returning after the inactivity threshold', () => {
    const nowMs = 10_000_000;

    expect(shouldShowSplashAfterInactivity(undefined, nowMs)).toBe(false);
    expect(
      shouldShowSplashAfterInactivity(
        nowMs - RECENT_INACTIVITY_THRESHOLD_MS + 1,
        nowMs,
      ),
    ).toBe(false);
    expect(
      shouldShowSplashAfterInactivity(
        nowMs - RECENT_INACTIVITY_THRESHOLD_MS,
        nowMs,
      ),
    ).toBe(true);
  });

  test('persists the last active timestamp', () => {
    setLastActiveAt(12345);
    expect(getLastActiveAt()).toBe(12345);
  });

  test('routes incomplete users to onboarding on startup', async () => {
    await expect(resolveStartupRoute()).resolves.toBe('OnboardingScreen');
    expect(getPermissionSnapshot).not.toHaveBeenCalled();
  });

  test('routes completed users to permissions when required access is missing', async () => {
    setOnboardingCompleted(true);
    (getPermissionSnapshot as jest.Mock).mockResolvedValue({
      allRequiredPermissionsEnabled: false,
    });

    await expect(resolveStartupRoute()).resolves.toBe('PermissionsSetupScreen');
  });

  test('routes completed users into the app when required access is ready', async () => {
    setOnboardingCompleted(true);
    (getPermissionSnapshot as jest.Mock).mockResolvedValue({
      allRequiredPermissionsEnabled: true,
    });

    await expect(resolveStartupRoute()).resolves.toBe('MainTabs');
    await expect(resolveProtectedEntryRoute()).resolves.toBe('MainTabs');
  });
});
