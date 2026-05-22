import { refreshMonitoringNow } from '../../services/MonitoringService';

/**
 * Legacy compatibility entrypoint.
 * Monitoring now handles both daily limits and manual focus sessions.
 */
export async function evaluateUsageLimits(): Promise<void> {
  await refreshMonitoringNow();
}
