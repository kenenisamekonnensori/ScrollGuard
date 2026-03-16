import { getUsageStats } from '../native/NativeBridgeService';
import { useUsageStore } from '../store/usageStore';

/**
 * Fetches today's usage from the native bridge, normalizes values,
 * and updates the global usage store.
 */
export async function fetchTodayUsage(): Promise<Record<string, number>> {
  const usageStats = await getUsageStats();
  const setUsageStats = useUsageStore.getState().setUsageStats;
  const normalizedUsage: Record<string, number> = {};

  Object.entries(usageStats).forEach(([packageName, value]) => {
    const safeSeconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    normalizedUsage[packageName] = safeSeconds;
  });

  setUsageStats(normalizedUsage);

  return normalizedUsage;
}
