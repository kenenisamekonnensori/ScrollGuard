import { evaluateUsageLimits } from '../src/features/limits/limitEngine';
import { blockApp } from '../src/features/blocking/blockingController';
import { sendLimitReachedNotification } from '../src/services/NotificationService';
import { MONITORED_PACKAGES, PACKAGE_LABELS } from '../src/utils/appPackages';

jest.mock('../src/features/blocking/blockingController', () => ({
  blockApp: jest.fn(),
}));

jest.mock('../src/services/NotificationService', () => ({
  sendLimitReachedNotification: jest.fn(),
}));

const mockUsageStateGetter = jest.fn();
const mockSettingsStateGetter = jest.fn();

jest.mock('../src/store/usageStore', () => ({
  useUsageStore: {
    getState: () => mockUsageStateGetter(),
  },
}));

jest.mock('../src/store/settingsStore', () => ({
  useSettingsStore: {
    getState: () => mockSettingsStateGetter(),
  },
}));

describe('limitEngine.evaluateUsageLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSettingsStateGetter.mockReturnValue({
      userSettings: {
        tiktokLimitMinutes: 20,
        instagramLimitMinutes: 15,
        youtubeLimitMinutes: 10,
        lockDurationMinutes: 30,
      },
    });
  });

  test('does not block when all apps are within or equal to limits', async () => {
    mockUsageStateGetter.mockReturnValue({
      usageStats: {
        [MONITORED_PACKAGES.tiktok]: 20 * 60,
        [MONITORED_PACKAGES.instagram]: 10 * 60,
        [MONITORED_PACKAGES.youtube]: 9 * 60,
      },
    });

    await evaluateUsageLimits();

    expect(blockApp).not.toHaveBeenCalled();
    expect(sendLimitReachedNotification).not.toHaveBeenCalled();
  });

  test('blocks app and notifies when a limit is exceeded', async () => {
    mockUsageStateGetter.mockReturnValue({
      usageStats: {
        [MONITORED_PACKAGES.tiktok]: 21 * 60,
        [MONITORED_PACKAGES.instagram]: 5 * 60,
        [MONITORED_PACKAGES.youtube]: 8 * 60,
      },
    });

    await evaluateUsageLimits();

    expect(blockApp).toHaveBeenCalledTimes(1);
    expect(blockApp).toHaveBeenCalledWith(MONITORED_PACKAGES.tiktok);
    expect(sendLimitReachedNotification).toHaveBeenCalledTimes(1);
    expect(sendLimitReachedNotification).toHaveBeenCalledWith(PACKAGE_LABELS[MONITORED_PACKAGES.tiktok]);
  });

  test('blocks each monitored app that exceeds its own limit', async () => {
    mockUsageStateGetter.mockReturnValue({
      usageStats: {
        [MONITORED_PACKAGES.tiktok]: 30 * 60,
        [MONITORED_PACKAGES.instagram]: 16 * 60,
        [MONITORED_PACKAGES.youtube]: 11 * 60,
      },
    });

    await evaluateUsageLimits();

    expect(blockApp).toHaveBeenCalledTimes(3);
    expect(sendLimitReachedNotification).toHaveBeenCalledTimes(3);
  });
});
