import { getUsageStats } from '../native/NativeBridgeService';
import { useUsageStore } from '../store/usageStore';
import {
  MONITORED_PACKAGE_ALIAS_LIST,
  MONITORED_PACKAGE_LIST,
  resolveCanonicalPackageName,
} from '../utils/appPackages';

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
    normalizedUsage[packageName] = 0;
  });

  MONITORED_PACKAGE_ALIAS_LIST.forEach(packageName => {
    const canonicalPackage = resolveCanonicalPackageName(packageName);
    const currentTotal = normalizedUsage[canonicalPackage] ?? 0;
    const additionalUsage = normalizeUsageSeconds(usageStats[packageName] ?? 0);
    normalizedUsage[canonicalPackage] = currentTotal + additionalUsage;
  });

  MONITORED_PACKAGE_LIST.forEach(packageName => {
    normalizedUsage[packageName] = normalizeUsageSeconds(normalizedUsage[packageName] ?? 0);
  });

  setUsageStats(normalizedUsage);

  return normalizedUsage;
}
