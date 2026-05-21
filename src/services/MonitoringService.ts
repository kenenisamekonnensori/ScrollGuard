import {
  AppStateStatus,
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';
import { enforceDailyLimitBlocks, reconcileExpiredLocks } from '../features/blocking/blockingController';
import { fetchTodayUsage } from './UsageService';
import { scrollService } from './ScrollService';
import { useUsageStore } from '../store/usageStore';
import {
  hasActiveFocusSessions,
  hasTrackingFocusSessionForPackage,
  refreshFocusSessions,
} from '../features/focus/focusSessionStore';
import { useSettingsStore } from '../store/settingsStore';
import {
  MONITORED_PACKAGE_ALIAS_LIST,
  resolveCanonicalPackageName,
} from '../utils/appPackages';
import {
  startForegroundProtectionService,
  stopForegroundProtectionService,
} from '../native/NativeBridgeService';

const POLL_INTERVAL_MS = 30_000;
const IDLE_POLL_INTERVAL_MS = 90_000;
const IDLE_BACKOFF_AFTER_MS = 2 * 60_000;
const FOREGROUND_EVENT_NAME = 'onForegroundAppChanged';
const FOREGROUND_REFRESH_DEBOUNCE_MS = 800;
const FOREGROUND_EVENT_MIN_GAP_MS = 250;
const MAX_OPTIMISTIC_SYNC_DELTA_SECONDS = 45;
const ENABLE_OPTIMISTIC_FOREGROUND_SYNC = true;

type ForegroundAppChangedPayload = {
  packageName?: string;
};

type MonitoringDiagnostics = {
  startedAtMs: number | null;
  totalTickRequests: number;
  executedTicks: number;
  successfulTicks: number;
  failedTicks: number;
  queuedTickRequests: number;
  foregroundEvents: number;
  monitoredForegroundEvents: number;
  duplicateForegroundEventsSkipped: number;
  appStateRefreshRequests: number;
  foregroundRefreshRequests: number;
  debouncedRefreshExecutions: number;
  optimisticSyncUpdates: number;
  optimisticSyncSecondsAdded: number;
  activePollSchedules: number;
  idlePollSchedules: number;
  lastScheduledPollIntervalMs: number;
  lastTickDurationMs: number;
  lastTickAtMs: number | null;
};

const initialDiagnostics: MonitoringDiagnostics = {
  startedAtMs: null,
  totalTickRequests: 0,
  executedTicks: 0,
  successfulTicks: 0,
  failedTicks: 0,
  queuedTickRequests: 0,
  foregroundEvents: 0,
  monitoredForegroundEvents: 0,
  duplicateForegroundEventsSkipped: 0,
  appStateRefreshRequests: 0,
  foregroundRefreshRequests: 0,
  debouncedRefreshExecutions: 0,
  optimisticSyncUpdates: 0,
  optimisticSyncSecondsAdded: 0,
  activePollSchedules: 0,
  idlePollSchedules: 0,
  lastScheduledPollIntervalMs: POLL_INTERVAL_MS,
  lastTickDurationMs: 0,
  lastTickAtMs: null,
};

const monitoredPackages: Set<string> = new Set(MONITORED_PACKAGE_ALIAS_LIST);

let usageTimeout: ReturnType<typeof setTimeout> | null = null;
let foregroundSubscription: EmitterSubscription | null = null;
let foregroundRefreshTimeout: ReturnType<typeof setTimeout> | null = null;
let isMonitoring = false;
let currentAppState: AppStateStatus = 'active';
let lastForegroundPackage: string | null = null;
let lastForegroundSwitchAtMs: number | null = null;
let lastMonitoredForegroundAtMs: number | null = null;
let lastForegroundEventAtMs = 0;
let monitorTickInFlight = false;
let monitorTickQueued = false;
let diagnostics: MonitoringDiagnostics = { ...initialDiagnostics };
const isTestEnvironment =
  typeof globalThis !== 'undefined' && 'jest' in globalThis;

async function monitorTick(): Promise<void> {
  await reconcileExpiredLocks();

  const dailyLimitEnabled = useSettingsStore.getState().userSettings.dailyLimitEnabled;
  const focusSessionsActive = hasActiveFocusSessions();

  const usageSnapshot = await fetchTodayUsage();
  useUsageStore.getState().setLastSyncedAt(Date.now());

  if (!dailyLimitEnabled && !focusSessionsActive) {
    return;
  }

  if (dailyLimitEnabled) {
    await enforceDailyLimitBlocks(usageSnapshot);
  }

  if (focusSessionsActive) {
    await refreshFocusSessions({ skipUsageRefresh: true });
  }
}

async function runMonitorTickCoalesced(): Promise<void> {
  diagnostics.totalTickRequests += 1;

  if (monitorTickInFlight) {
    monitorTickQueued = true;
    diagnostics.queuedTickRequests += 1;
    return;
  }

  monitorTickInFlight = true;
  diagnostics.executedTicks += 1;
  const tickStartedAtMs = Date.now();

  try {
    await monitorTick();
    diagnostics.successfulTicks += 1;
    diagnostics.lastTickAtMs = Date.now();
  } finally {
    diagnostics.lastTickDurationMs = Math.max(Date.now() - tickStartedAtMs, 0);
    monitorTickInFlight = false;

    if (monitorTickQueued) {
      monitorTickQueued = false;
      runMonitorTickCoalesced().catch(error => {
        diagnostics.failedTicks += 1;
        if (__DEV__) {
          console.warn('[MonitoringService] Failed queued monitoring tick.', error);
        }
      });
    }
  }
}

function clearForegroundRefreshTimeout(): void {
  if (foregroundRefreshTimeout) {
    clearTimeout(foregroundRefreshTimeout);
    foregroundRefreshTimeout = null;
  }
}

function resetForegroundTracking(): void {
  lastForegroundPackage = null;
  lastForegroundSwitchAtMs = null;
  lastMonitoredForegroundAtMs = null;
  lastForegroundEventAtMs = 0;
}

function getCurrentPollIntervalMs(nowMs = Date.now()): number {
  if (currentAppState !== 'active') {
    return IDLE_POLL_INTERVAL_MS;
  }

  if (!lastMonitoredForegroundAtMs) {
    return POLL_INTERVAL_MS;
  }

  if (nowMs - lastMonitoredForegroundAtMs > IDLE_BACKOFF_AFTER_MS) {
    return IDLE_POLL_INTERVAL_MS;
  }

  return POLL_INTERVAL_MS;
}

function clearUsageTimeout(): void {
  if (usageTimeout) {
    clearTimeout(usageTimeout);
    usageTimeout = null;
  }
}

function scheduleNextMonitorTick(): void {
  if (!isMonitoring) {
    return;
  }

  clearUsageTimeout();
  const nextIntervalMs = getCurrentPollIntervalMs();
  diagnostics.lastScheduledPollIntervalMs = nextIntervalMs;

  if (nextIntervalMs === IDLE_POLL_INTERVAL_MS) {
    diagnostics.idlePollSchedules += 1;
  } else {
    diagnostics.activePollSchedules += 1;
  }

  usageTimeout = setTimeout(() => {
    usageTimeout = null;

    if (!isMonitoring) {
      return;
    }

    if (currentAppState === 'active') {
      refreshMonitoringNow().catch(error => {
        diagnostics.failedTicks += 1;
        if (__DEV__) {
          console.warn('[MonitoringService] Failed scheduled monitoring refresh.', error);
        }
      });
    }

    scheduleNextMonitorTick();
  }, nextIntervalMs);
}

function resolveForegroundPackage(event: unknown): string | null {
  if (typeof event === 'string') {
    const value = event.trim();
    return value.length > 0 ? value : null;
  }

  if (typeof event !== 'object' || event === null) {
    return null;
  }

  const payload = event as ForegroundAppChangedPayload;
  const packageName = payload.packageName?.trim();
  return packageName && packageName.length > 0 ? packageName : null;
}

function scheduleDebouncedMonitoringRefresh(trigger: 'foreground' | 'appState'): void {
  if (!isMonitoring || currentAppState !== 'active') {
    return;
  }

  clearForegroundRefreshTimeout();

  if (trigger === 'foreground') {
    diagnostics.foregroundRefreshRequests += 1;
  } else {
    diagnostics.appStateRefreshRequests += 1;
  }

  foregroundRefreshTimeout = setTimeout(() => {
    foregroundRefreshTimeout = null;

    if (!isMonitoring || currentAppState !== 'active') {
      return;
    }

    if (__DEV__) {
      console.log(`[MonitoringService] Debounced sync trigger (${trigger})`);
    }

    diagnostics.debouncedRefreshExecutions += 1;
    refreshMonitoringNow().catch(error => {
      diagnostics.failedTicks += 1;
      if (__DEV__) {
        console.warn('[MonitoringService] Failed debounced monitoring refresh.', error);
      }
    });
  }, FOREGROUND_REFRESH_DEBOUNCE_MS);
}

function applyOptimisticForegroundSync(nextPackage: string, eventAtMs: number): void {
  if (!ENABLE_OPTIMISTIC_FOREGROUND_SYNC) {
    return;
  }

  const previousPackage = lastForegroundPackage;
  const previousStartedAtMs = lastForegroundSwitchAtMs;

  if (!previousPackage || !previousStartedAtMs) {
    return;
  }

  if (previousPackage === nextPackage || !monitoredPackages.has(previousPackage)) {
    return;
  }

  if (!hasTrackingFocusSessionForPackage(previousPackage)) {
    return;
  }

  const elapsedSeconds = Math.floor(Math.max(0, eventAtMs - previousStartedAtMs) / 1000);
  if (elapsedSeconds <= 0) {
    return;
  }

  const boundedDelta = Math.min(elapsedSeconds, MAX_OPTIMISTIC_SYNC_DELTA_SECONDS);
  const canonicalPackage = resolveCanonicalPackageName(previousPackage);
  const { usageStats, updateUsage } = useUsageStore.getState();
  const currentSeconds = usageStats[canonicalPackage] ?? 0;

  updateUsage(canonicalPackage, currentSeconds + boundedDelta);
  diagnostics.optimisticSyncUpdates += 1;
  diagnostics.optimisticSyncSecondsAdded += boundedDelta;

  if (__DEV__) {
    console.log(
      `[MonitoringService] Optimistic sync ${canonicalPackage} +${boundedDelta}s (raw=${elapsedSeconds}s)`,
    );
  }
}

function handleForegroundAppChanged(event: unknown): void {
  if (!isMonitoring) {
    return;
  }

  const packageName = resolveForegroundPackage(event);
  if (!packageName) {
    return;
  }

  diagnostics.foregroundEvents += 1;

  const now = Date.now();

  if (
    packageName === lastForegroundPackage
    && now - lastForegroundEventAtMs < FOREGROUND_EVENT_MIN_GAP_MS
  ) {
    diagnostics.duplicateForegroundEventsSkipped += 1;
    return;
  }

  lastForegroundEventAtMs = now;

  if (__DEV__) {
    console.log(`[MonitoringService] Foreground package detected: ${packageName}`);
  }

  if (monitoredPackages.has(packageName)) {
    lastMonitoredForegroundAtMs = now;
    diagnostics.monitoredForegroundEvents += 1;
  }

  if (packageName === lastForegroundPackage) {
    return;
  }

  applyOptimisticForegroundSync(packageName, now);

  lastForegroundPackage = packageName;
  lastForegroundSwitchAtMs = now;

  scheduleDebouncedMonitoringRefresh('foreground');
}

function setupForegroundListener(): void {
  foregroundSubscription?.remove();
  foregroundSubscription = DeviceEventEmitter.addListener(
    FOREGROUND_EVENT_NAME,
    handleForegroundAppChanged,
  );
}

function teardownForegroundListener(): void {
  foregroundSubscription?.remove();
  foregroundSubscription = null;
  clearForegroundRefreshTimeout();
  resetForegroundTracking();
}

export async function refreshMonitoringNow(): Promise<void> {
  try {
    await runMonitorTickCoalesced();
  } catch (error) {
    diagnostics.failedTicks += 1;
    if (__DEV__) {
      console.warn('[MonitoringService] Failed to refresh monitoring tick.', error);
    }
  }
}

export async function startMonitoring(): Promise<void> {
  if (isMonitoring) {
    return;
  }

  if (isTestEnvironment) {
    return;
  }

  isMonitoring = true;
  diagnostics.startedAtMs = Date.now();

  startForegroundProtectionService();
  scrollService.startListening();
  setupForegroundListener();

  await refreshMonitoringNow();
  scheduleNextMonitorTick();
}

export function stopMonitoring(): void {
  if (!isMonitoring) {
    return;
  }

  isMonitoring = false;

  clearUsageTimeout();

  teardownForegroundListener();
  stopForegroundProtectionService();
  scrollService.stopListening();
}

export function onAppStateChanged(nextState: AppStateStatus): void {
  currentAppState = nextState;

  if (nextState === 'active') {
    scheduleNextMonitorTick();
    scheduleDebouncedMonitoringRefresh('appState');
  }
}

export function getMonitoringDiagnostics(): MonitoringDiagnostics {
  return { ...diagnostics };
}

export function resetMonitoringDiagnostics(): void {
  diagnostics = {
    ...initialDiagnostics,
    startedAtMs: isMonitoring ? Date.now() : null,
  };
}
