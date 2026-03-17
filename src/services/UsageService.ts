import { getUsageStats } from '../native/NativeBridgeService';
import { useUsageStore } from '../store/usageStore';
import { MONITORED_PACKAGE_LIST } from '../utils/appPackages';

function normalizeUsageSeconds(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
}

/**
 * Fetches today's usage from the native bridge, normalizes values,
 * and updates the global usage store.
 */
export async function fetchTodayUsage(): Promise<Record<string, number>> {
  const usageStats = await getUsageStats();
  const setUsageStats = useUsageStore.getState().setUsageStats;
  const normalizedUsage: Record<string, number> = {};

  MONITORED_PACKAGE_LIST.forEach(packageName => {
    normalizedUsage[packageName] = normalizeUsageSeconds(usageStats[packageName] ?? 0);
  });

  setUsageStats(normalizedUsage);

  return normalizedUsage;
}
