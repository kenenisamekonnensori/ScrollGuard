import { MONITORED_PACKAGE_LIST, MONITORED_PACKAGES } from '../src/utils/appPackages';
import { fetchTodayUsage } from '../src/services/UsageService';
import { getUsageStats } from '../src/native/NativeBridgeService';
import { useUsageStore } from '../src/store/usageStore';

jest.mock('../src/native/NativeBridgeService', () => ({
  getUsageStats: jest.fn(),
}));

const setUsageStatsMock = jest.fn();

jest.mock('../src/store/usageStore', () => ({
  useUsageStore: {
    getState: jest.fn(() => ({
      setUsageStats: setUsageStatsMock,
    })),
  },
}));

describe('UsageService.fetchTodayUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('normalizes usage and persists only monitored packages', async () => {
    (getUsageStats as jest.Mock).mockResolvedValue({
      [MONITORED_PACKAGES.tiktok]: 120.9,
      [MONITORED_PACKAGES.instagram]: -50,
      [MONITORED_PACKAGES.youtube]: Number.NaN,
      'com.other.app': 999,
    });

    const result = await fetchTodayUsage();

    expect(Object.keys(result)).toEqual(MONITORED_PACKAGE_LIST);
    expect(result[MONITORED_PACKAGES.tiktok]).toBe(120);
    expect(result[MONITORED_PACKAGES.instagram]).toBe(0);
    expect(result[MONITORED_PACKAGES.youtube]).toBe(0);

    expect(setUsageStatsMock).toHaveBeenCalledTimes(1);
    expect(setUsageStatsMock).toHaveBeenCalledWith(result);
  });

  test('fills missing package entries with zero', async () => {
    (getUsageStats as jest.Mock).mockResolvedValue({
      [MONITORED_PACKAGES.tiktok]: 60,
    });

    const result = await fetchTodayUsage();

    expect(result[MONITORED_PACKAGES.tiktok]).toBe(60);
    expect(result[MONITORED_PACKAGES.instagram]).toBe(0);
    expect(result[MONITORED_PACKAGES.youtube]).toBe(0);
  });

  test('treats non-finite values as zero', async () => {
    (getUsageStats as jest.Mock).mockResolvedValue({
      [MONITORED_PACKAGES.tiktok]: Infinity,
      [MONITORED_PACKAGES.instagram]: Number.NaN,
      [MONITORED_PACKAGES.youtube]: 10,
    });

    const result = await fetchTodayUsage();

    expect(result[MONITORED_PACKAGES.tiktok]).toBe(0);
    expect(result[MONITORED_PACKAGES.instagram]).toBe(0);
    expect(result[MONITORED_PACKAGES.youtube]).toBe(10);
  });

  test('uses usage store getter from current state shape', () => {
    expect(useUsageStore.getState).toBeDefined();
  });
});
