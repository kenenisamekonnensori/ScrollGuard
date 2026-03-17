import { AppStateStatus } from 'react-native';
import { evaluateUsageLimits } from '../features/limits/limitEngine';
import { fetchTodayUsage } from './UsageService';
import { scrollService } from './ScrollService';
import { useUsageStore } from '../store/usageStore';

const POLL_INTERVAL_MS = 30_000;

let usageInterval: ReturnType<typeof setInterval> | null = null;
let isMonitoring = false;
let currentAppState: AppStateStatus = 'active';
const isTestEnvironment =
  typeof globalThis !== 'undefined' && 'jest' in globalThis;

async function monitorTick(): Promise<void> {
  await fetchTodayUsage();
  await evaluateUsageLimits();
  useUsageStore.getState().setLastSyncedAt(Date.now());
}

export async function refreshMonitoringNow(): Promise<void> {
  try {
    await monitorTick();
  } catch (error) {
    if (__DEV__) {
      console.warn('[MonitoringService] Failed to refresh monitoring tick.', error);
    }
  }
}

export async function startMonitoring(): Promise<void> {
  if (isMonitoring) {
    return;
  }

  isMonitoring = true;

  if (isTestEnvironment) {
    return;
  }

  scrollService.startListening();

  await refreshMonitoringNow();

  usageInterval = setInterval(() => {
    if (currentAppState !== 'active') {
      return;
    }

    void refreshMonitoringNow();
  }, POLL_INTERVAL_MS);
}

export function stopMonitoring(): void {
  if (!isMonitoring) {
    return;
  }

  isMonitoring = false;

  if (usageInterval) {
    clearInterval(usageInterval);
    usageInterval = null;
  }

  scrollService.stopListening();
}

export function onAppStateChanged(nextState: AppStateStatus): void {
  currentAppState = nextState;

  if (nextState === 'active') {
    void refreshMonitoringNow();
  }
}
