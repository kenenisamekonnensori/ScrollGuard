import { MONITORED_PACKAGE_GROUPS, MONITORED_PACKAGES } from '../src/utils/appPackages';

const mockGetValue = jest.fn();
const mockSetValue = jest.fn();
const mockFetchTodayUsage = jest.fn();
const mockBlockApp = jest.fn();
const mockUnblockAppFamily = jest.fn();
const mockGetResolvedAppLocks = jest.fn();
const mockUsageStateGetter = jest.fn();

jest.mock('../src/db/storage', () => ({
  getValue: (...args: unknown[]) => mockGetValue(...args),
  setValue: (...args: unknown[]) => mockSetValue(...args),
}));

jest.mock('../src/services/UsageService', () => ({
  fetchTodayUsage: (...args: unknown[]) => mockFetchTodayUsage(...args),
}));

jest.mock('../src/features/blocking/blockingController', () => ({
  blockApp: (...args: unknown[]) => mockBlockApp(...args),
  unblockAppFamily: (...args: unknown[]) => mockUnblockAppFamily(...args),
  getResolvedAppLocks: (...args: unknown[]) => mockGetResolvedAppLocks(...args),
}));

jest.mock('../src/services/NotificationService', () => ({
  sendLimitReachedNotification: jest.fn(),
  sendWarningNotification: jest.fn(),
}));

jest.mock('../src/store/usageStore', () => ({
  useUsageStore: {
    getState: () => mockUsageStateGetter(),
  },
}));

describe('focusSessionStore', () => {
  function getStoreModule(): typeof import('../src/features/focus/focusSessionStore') {
    return require('../src/features/focus/focusSessionStore');
  }

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockGetValue.mockReturnValue([]);
    mockFetchTodayUsage.mockResolvedValue({
      [MONITORED_PACKAGES.instagram]: 120,
      [MONITORED_PACKAGES.tiktok]: 0,
      [MONITORED_PACKAGES.youtube]: 0,
    });
    mockUsageStateGetter.mockReturnValue({
      usageStats: {
        [MONITORED_PACKAGES.instagram]: 120,
      },
    });
    mockBlockApp.mockResolvedValue(undefined);
    mockUnblockAppFamily.mockResolvedValue(undefined);
    mockGetResolvedAppLocks.mockResolvedValue([]);
  });

  test('starts one tracking session and prevents duplicate sessions for the same app', async () => {
    const { useFocusSessionStore } = getStoreModule();

    const session = await useFocusSessionStore.getState().startFocusSession({
      appFamily: 'instagram',
      allowedUsageMinutes: 10,
      blockDurationMinutes: 30,
    });

    expect(session.status).toBe('tracking');
    expect(session.baselineUsageSeconds).toBe(120);
    expect(mockSetValue).toHaveBeenCalled();
    expect(mockBlockApp).not.toHaveBeenCalled();

    await expect(
      useFocusSessionStore.getState().startFocusSession({
        appFamily: 'instagram',
        allowedUsageMinutes: 10,
        blockDurationMinutes: 30,
      }),
    ).rejects.toThrow('A focus session is already active for this app.');
  });

  test('restores active sessions from persisted storage after process restart', () => {
    const now = Date.now();
    mockGetValue.mockReturnValue([
      {
        id: 'instagram-active',
        appFamily: 'instagram',
        status: 'tracking',
        allowedUsageSeconds: 600,
        blockDurationSeconds: 1800,
        baselineUsageSeconds: 120,
        consumedUsageSeconds: 90,
        warningThresholdsSent: [50],
        startedAt: now - 90_000,
        updatedAt: now - 1_000,
        blockedAt: null,
        blockedUntil: null,
        completedAt: null,
      },
    ]);

    const { useFocusSessionStore, hasActiveFocusSessions } = getStoreModule();

    const [session] = useFocusSessionStore.getState().sessions;
    expect(session).toEqual(
      expect.objectContaining({
        id: 'instagram-active',
        appFamily: 'instagram',
        packageName: MONITORED_PACKAGES.instagram,
        packageNames: MONITORED_PACKAGE_GROUPS.instagram,
        appName: 'Instagram',
        status: 'tracking',
      }),
    );
    expect(hasActiveFocusSessions()).toBe(true);
  });

  test('moves tracking session to blocked after allowed usage is consumed', async () => {
    const { useFocusSessionStore } = getStoreModule();

    await useFocusSessionStore.getState().startFocusSession({
      appFamily: 'instagram',
      allowedUsageMinutes: 1,
      blockDurationMinutes: 15,
    });

    mockUsageStateGetter.mockReturnValue({
      usageStats: {
        [MONITORED_PACKAGES.instagram]: 181,
      },
    });

    await useFocusSessionStore.getState().refreshFocusSessions();

    const [session] = useFocusSessionStore.getState().sessions;
    expect(session.status).toBe('blocked');
    expect(mockBlockApp).toHaveBeenCalledWith(MONITORED_PACKAGES.instagram, 15, 'focus');
    expect(mockBlockApp).toHaveBeenCalledWith(MONITORED_PACKAGE_GROUPS.instagram[1], 15, 'focus');
  });

  test('completes expired blocked sessions without returning to tracking', async () => {
    const now = Date.now();
    mockGetValue.mockReturnValue([
      {
        id: 'instagram-expired',
        appFamily: 'instagram',
        status: 'blocked',
        allowedUsageSeconds: 60,
        blockDurationSeconds: 900,
        baselineUsageSeconds: 0,
        consumedUsageSeconds: 60,
        warningThresholdsSent: [],
        startedAt: now - 2_000,
        updatedAt: now - 1_000,
        blockedAt: now - 1_000,
        blockedUntil: now - 1,
        completedAt: null,
      },
    ]);

    const { useFocusSessionStore } = getStoreModule();

    await useFocusSessionStore.getState().refreshFocusSessions();

    const [session] = useFocusSessionStore.getState().sessions;
    expect(session.status).toBe('completed');
    expect(mockUnblockAppFamily).toHaveBeenCalledWith(MONITORED_PACKAGES.instagram, 'focus');
  });
});
