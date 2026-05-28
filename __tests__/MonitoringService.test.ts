const mockReconcileExpiredLocks = jest.fn();
const mockEnforceDailyLimitBlocks = jest.fn();
const mockFetchTodayUsage = jest.fn();
const mockRefreshFocusSessions = jest.fn();
const mockHasActiveFocusSessions = jest.fn();
const mockHasTrackingFocusSessions = jest.fn();
const mockSetLastSyncedAt = jest.fn();
const mockUseSettingsStoreGetState = jest.fn();
const mockUseUsageStoreGetState = jest.fn();

jest.mock('../src/features/blocking/blockingController', () => ({
  reconcileExpiredLocks: (...args: unknown[]) => mockReconcileExpiredLocks(...args),
  enforceDailyLimitBlocks: (...args: unknown[]) => mockEnforceDailyLimitBlocks(...args),
}));

jest.mock('../src/services/UsageService', () => ({
  fetchTodayUsage: (...args: unknown[]) => mockFetchTodayUsage(...args),
}));

jest.mock('../src/features/focus/focusSessionStore', () => ({
  hasActiveFocusSessions: (...args: unknown[]) => mockHasActiveFocusSessions(...args),
  hasTrackingFocusSessions: (...args: unknown[]) => mockHasTrackingFocusSessions(...args),
  refreshFocusSessions: (...args: unknown[]) => mockRefreshFocusSessions(...args),
  hasTrackingFocusSessionForPackage: jest.fn(() => false),
}));

jest.mock('../src/store/settingsStore', () => ({
  useSettingsStore: {
    getState: (...args: unknown[]) => mockUseSettingsStoreGetState(...args),
  },
}));

jest.mock('../src/store/usageStore', () => ({
  useUsageStore: {
    getState: (...args: unknown[]) => mockUseUsageStoreGetState(...args),
  },
}));

jest.mock('../src/services/ScrollService', () => ({
  scrollService: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
}));

jest.mock('../src/native/NativeBridgeService', () => ({
  startForegroundProtectionService: jest.fn(),
  stopForegroundProtectionService: jest.fn(),
}));

describe('MonitoringService.refreshMonitoringNow', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSettingsStoreGetState.mockReturnValue({
      userSettings: {
        dailyLimitEnabled: false,
      },
    });

    mockUseUsageStoreGetState.mockReturnValue({
      setLastSyncedAt: mockSetLastSyncedAt,
    });

    mockHasActiveFocusSessions.mockReturnValue(false);
    mockHasTrackingFocusSessions.mockReturnValue(false);
    mockFetchTodayUsage.mockResolvedValue({
      'com.instagram.android': 120,
      'com.zhiliaoapp.musically': 0,
      'com.google.android.youtube': 0,
    });
    mockRefreshFocusSessions.mockResolvedValue(undefined);
    mockEnforceDailyLimitBlocks.mockResolvedValue(undefined);
    mockReconcileExpiredLocks.mockResolvedValue(undefined);
  });

  function getService(): typeof import('../src/services/MonitoringService') {
    return require('../src/services/MonitoringService');
  }

  test('skips usage refresh when both daily limits and focus sessions are inactive', async () => {
    const { refreshMonitoringNow } = getService();

    await refreshMonitoringNow();

    expect(mockReconcileExpiredLocks).toHaveBeenCalledTimes(1);
    expect(mockFetchTodayUsage).not.toHaveBeenCalled();
    expect(mockSetLastSyncedAt).not.toHaveBeenCalled();
    expect(mockEnforceDailyLimitBlocks).not.toHaveBeenCalled();
    expect(mockRefreshFocusSessions).not.toHaveBeenCalled();
  });

  test('refreshes usage and stamps lastSyncedAt when daily limits are active', async () => {
    mockUseSettingsStoreGetState.mockReturnValue({
      userSettings: {
        dailyLimitEnabled: true,
      },
    });

    const usageSnapshot = {
      'com.instagram.android': 120,
      'com.zhiliaoapp.musically': 0,
      'com.google.android.youtube': 0,
    };
    mockFetchTodayUsage.mockResolvedValue(usageSnapshot);

    const { refreshMonitoringNow } = getService();

    await refreshMonitoringNow();

    expect(mockFetchTodayUsage).toHaveBeenCalledTimes(1);
    expect(mockSetLastSyncedAt).toHaveBeenCalledTimes(1);
    expect(mockEnforceDailyLimitBlocks).toHaveBeenCalledWith(usageSnapshot);
    expect(mockRefreshFocusSessions).not.toHaveBeenCalled();
  });

  test('refreshes focus sessions without forcing a usage fetch when only focus is active', async () => {
    mockHasActiveFocusSessions.mockReturnValue(true);
    mockHasTrackingFocusSessions.mockReturnValue(true);

    const { refreshMonitoringNow } = getService();

    await refreshMonitoringNow();

    expect(mockFetchTodayUsage).not.toHaveBeenCalled();
    expect(mockSetLastSyncedAt).not.toHaveBeenCalled();
    expect(mockRefreshFocusSessions).toHaveBeenCalledWith({ skipUsageRefresh: true });
  });

  test('refreshes blocked focus sessions without forcing a usage fetch', async () => {
    mockHasActiveFocusSessions.mockReturnValue(true);
    mockHasTrackingFocusSessions.mockReturnValue(false);

    const { refreshMonitoringNow } = getService();

    await refreshMonitoringNow();

    expect(mockFetchTodayUsage).not.toHaveBeenCalled();
    expect(mockRefreshFocusSessions).toHaveBeenCalledWith({ skipUsageRefresh: true });
  });

  test('continues focus enforcement when usage refresh fails while focus sessions are active', async () => {
    mockHasActiveFocusSessions.mockReturnValue(true);
    mockHasTrackingFocusSessions.mockReturnValue(true);
    mockFetchTodayUsage.mockRejectedValue(new Error('Usage access missing'));

    const { refreshMonitoringNow } = getService();

    await refreshMonitoringNow();

    expect(mockRefreshFocusSessions).toHaveBeenCalledWith({ skipUsageRefresh: true });
    expect(mockEnforceDailyLimitBlocks).not.toHaveBeenCalled();
    expect(mockSetLastSyncedAt).not.toHaveBeenCalled();
  });

  test('does not stamp lastSyncedAt when usage refresh fails', async () => {
    mockUseSettingsStoreGetState.mockReturnValue({
      userSettings: {
        dailyLimitEnabled: true,
      },
    });
    mockFetchTodayUsage.mockRejectedValue(new Error('Usage access missing'));

    const { refreshMonitoringNow } = getService();

    await refreshMonitoringNow();

    expect(mockFetchTodayUsage).toHaveBeenCalledTimes(1);
    expect(mockSetLastSyncedAt).not.toHaveBeenCalled();
    expect(mockEnforceDailyLimitBlocks).not.toHaveBeenCalled();
  });
});
