import { evaluateUsageLimits } from '../src/features/limits/limitEngine';
import {
  blockApp,
  isAppBlocked,
} from '../src/features/blocking/blockingController';
import { sendLimitReachedNotification } from '../src/services/NotificationService';
import {
  MONITORED_PACKAGES,
  MONITORED_PACKAGE_GROUPS,
  PACKAGE_LABELS,
} from '../src/utils/appPackages';

jest.mock('../src/features/blocking/blockingController', () => ({
  blockApp: jest.fn(),
  isAppBlocked: jest.fn(),
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
    (isAppBlocked as jest.Mock).mockReturnValue(false);

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

    expect(blockApp).toHaveBeenCalledTimes(MONITORED_PACKAGE_GROUPS.tiktok.length);
    expect(blockApp).toHaveBeenNthCalledWith(1, MONITORED_PACKAGE_GROUPS.tiktok[0]);
    expect(blockApp).toHaveBeenNthCalledWith(2, MONITORED_PACKAGE_GROUPS.tiktok[1]);
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

    expect(blockApp).toHaveBeenCalledTimes(
      MONITORED_PACKAGE_GROUPS.tiktok.length
        + MONITORED_PACKAGE_GROUPS.instagram.length
        + MONITORED_PACKAGE_GROUPS.youtube.length,
    );
    expect(sendLimitReachedNotification).toHaveBeenCalledTimes(3);
  });

  test('does not re-block or re-notify apps that are already locked', async () => {
    mockUsageStateGetter.mockReturnValue({
      usageStats: {
        [MONITORED_PACKAGES.tiktok]: 30 * 60,
      },
    });
    (isAppBlocked as jest.Mock).mockReturnValue(true);

    await evaluateUsageLimits();

    expect(blockApp).not.toHaveBeenCalled();
    expect(sendLimitReachedNotification).not.toHaveBeenCalled();
  });
});
