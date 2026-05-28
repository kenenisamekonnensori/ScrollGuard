import { create } from 'zustand';
import {
  getResolvedAppLocks,
  blockApp,
  unblockAppFamily,
} from '../blocking/blockingController';
import { sendLimitReachedNotification, sendWarningNotification } from '../../services/NotificationService';
import { fetchTodayUsage } from '../../services/UsageService';
import { useUsageStore } from '../../store/usageStore';
import { getValue, setValue } from '../../db/storage';
import {
  MONITORED_PACKAGE_GROUPS,
  PACKAGE_LABELS,
  MonitoredAppFamily,
} from '../../utils/appPackages';
import { FocusSession, StartFocusSessionInput } from './focusSessionTypes';

const FOCUS_SESSIONS_STORAGE_KEY = 'focus.sessions.v1';
const ACTIVE_SESSION_STATUSES = new Set<FocusSession['status']>(['tracking', 'blocked']);
const WARNING_THRESHOLDS = [50, 75] as const;

type FocusSessionState = {
  sessions: FocusSession[];
  isRefreshing: boolean;
  lastError: string | null;
  startFocusSession: (input: StartFocusSessionInput) => Promise<FocusSession>;
  refreshFocusSessions: (options?: { skipUsageRefresh?: boolean }) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
};

function now(): number {
  return Date.now();
}

function toSeconds(minutes: number): number {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }

  return Math.floor(minutes * 60);
}

function isActiveSession(session: FocusSession): boolean {
  return ACTIVE_SESSION_STATUSES.has(session.status);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeNumber(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.floor(value);
}

function getAppMetadata(appFamily: MonitoredAppFamily): {
  packageName: string;
  packageNames: readonly string[];
  appName: string;
} {
  const packageNames = MONITORED_PACKAGE_GROUPS[appFamily];
  const packageName = packageNames[0];

  return {
    packageName,
    packageNames,
    appName: PACKAGE_LABELS[packageName] ?? packageName,
  };
}

function sanitizeSession(value: unknown): FocusSession | undefined {
  if (!isObjectRecord(value)) {
    return undefined;
  }

  const appFamily = value.appFamily;
  if (
    appFamily !== 'tiktok'
    && appFamily !== 'instagram'
    && appFamily !== 'youtube'
  ) {
    return undefined;
  }

  const status = value.status;
  if (
    status !== 'idle'
    && status !== 'tracking'
    && status !== 'blocked'
    && status !== 'completed'
  ) {
    return undefined;
  }

  const metadata = getAppMetadata(appFamily);

  return {
    id: typeof value.id === 'string' && value.id.length > 0
      ? value.id
      : `${appFamily}-${sanitizeNumber(value.startedAt, now())}`,
    appFamily,
    packageName: metadata.packageName,
    packageNames: metadata.packageNames,
    appName: metadata.appName,
    status,
    allowedUsageSeconds: sanitizeNumber(value.allowedUsageSeconds),
    blockDurationSeconds: sanitizeNumber(value.blockDurationSeconds),
    baselineUsageSeconds: sanitizeNumber(value.baselineUsageSeconds),
    consumedUsageSeconds: sanitizeNumber(value.consumedUsageSeconds),
    warningThresholdsSent: Array.isArray(value.warningThresholdsSent)
      ? value.warningThresholdsSent
        .map(item => sanitizeNumber(item, -1))
        .filter(item => item >= 0)
      : [],
    startedAt: sanitizeNumber(value.startedAt, now()),
    updatedAt: sanitizeNumber(value.updatedAt, now()),
    blockedAt: typeof value.blockedAt === 'number' ? sanitizeNumber(value.blockedAt) : null,
    blockedUntil: typeof value.blockedUntil === 'number' ? sanitizeNumber(value.blockedUntil) : null,
    completedAt: typeof value.completedAt === 'number' ? sanitizeNumber(value.completedAt) : null,
  };
}

function readSessions(): FocusSession[] {
  const persisted = getValue<unknown>(FOCUS_SESSIONS_STORAGE_KEY);
  if (!Array.isArray(persisted)) {
    return [];
  }

  return persisted
    .map(item => sanitizeSession(item))
    .filter((item): item is FocusSession => Boolean(item));
}

function persistSessions(sessions: FocusSession[]): void {
  setValue(FOCUS_SESSIONS_STORAGE_KEY, sessions);
}

function replaceSession(sessions: FocusSession[], nextSession: FocusSession): FocusSession[] {
  return sessions.map(session => (
    session.id === nextSession.id ? nextSession : session
  ));
}

function hasActiveSessionForApp(sessions: FocusSession[], appFamily: MonitoredAppFamily): boolean {
  return sessions.some(session => session.appFamily === appFamily && isActiveSession(session));
}

function getConsumedUsageSeconds(session: FocusSession): number {
  const usageStats = useUsageStore.getState().usageStats;
  const currentUsageSeconds = usageStats[session.packageName] ?? 0;
  return Math.max(currentUsageSeconds - session.baselineUsageSeconds, 0);
}

function estimateConsumedUsageSeconds(session: FocusSession, timestamp: number): number {
  const usageBasedSeconds = getConsumedUsageSeconds(session);
  const elapsedSinceUpdateSeconds = Math.max(
    Math.floor((timestamp - session.updatedAt) / 1000),
    0,
  );
  const timeBasedSeconds = session.status === 'tracking'
    ? session.consumedUsageSeconds + elapsedSinceUpdateSeconds
    : session.consumedUsageSeconds;

  return Math.max(usageBasedSeconds, timeBasedSeconds);
}

async function blockSessionApps(session: FocusSession): Promise<void> {
  const durationMinutes = Math.ceil(session.blockDurationSeconds / 60);
  await Promise.all(
    session.packageNames.map(packageName => blockApp(packageName, durationMinutes, 'focus')),
  );
}

async function completeExpiredBlock(session: FocusSession, timestamp: number): Promise<FocusSession> {
  try {
    await unblockAppFamily(session.packageName, 'focus');
  } catch (error) {
    if (__DEV__) {
      console.warn('[focusSessionStore] Failed to release expired focus block.', error);
    }
  }

  return {
    ...session,
    status: 'completed',
    consumedUsageSeconds: Math.max(session.consumedUsageSeconds, session.allowedUsageSeconds),
    updatedAt: timestamp,
    completedAt: timestamp,
  };
}

async function reconcileSession(session: FocusSession, timestamp: number): Promise<FocusSession> {
  if (session.status === 'completed' || session.status === 'idle') {
    return session;
  }

  if (session.status === 'blocked') {
    if (session.blockedUntil && session.blockedUntil <= timestamp) {
      return completeExpiredBlock(session, timestamp);
    }

    return {
      ...session,
      updatedAt: timestamp,
    };
  }

  const consumedUsageSeconds = estimateConsumedUsageSeconds(session, timestamp);
  const usagePercent = session.allowedUsageSeconds > 0
    ? (consumedUsageSeconds / session.allowedUsageSeconds) * 100
    : 100;
  const warningThresholdsSent = [...session.warningThresholdsSent];

  WARNING_THRESHOLDS.forEach(threshold => {
    if (usagePercent >= threshold && !warningThresholdsSent.includes(threshold)) {
      warningThresholdsSent.push(threshold);
      sendWarningNotification(session.appName, consumedUsageSeconds / 60, threshold);
    }
  });

  if (consumedUsageSeconds < session.allowedUsageSeconds) {
    return {
      ...session,
      consumedUsageSeconds,
      warningThresholdsSent,
      updatedAt: timestamp,
    };
  }

  const blockedUntil = timestamp + session.blockDurationSeconds * 1000;
  const blockedSession: FocusSession = {
    ...session,
    status: 'blocked',
    consumedUsageSeconds,
    warningThresholdsSent,
    blockedAt: timestamp,
    blockedUntil,
    updatedAt: timestamp,
  };

  try {
    await blockSessionApps(blockedSession);
  } catch (error) {
    if (__DEV__) {
      console.warn('[focusSessionStore] Failed to apply native focus block.', error);
    }
  }
  sendLimitReachedNotification(session.appName);
  return blockedSession;
}

export const useFocusSessionStore = create<FocusSessionState>((set, get) => ({
  sessions: readSessions(),
  isRefreshing: false,
  lastError: null,

  startFocusSession: async input => {
    if (input.allowedUsageMinutes <= 0 || input.blockDurationMinutes <= 0) {
      throw new Error('Focus session durations must be greater than zero.');
    }

    const metadata = getAppMetadata(input.appFamily);
    const timestamp = now();
    let baselineUsageSeconds = 0;

    try {
      const usageStats = await fetchTodayUsage();
      baselineUsageSeconds = sanitizeNumber(usageStats[metadata.packageName]);
    } catch (error) {
      if (__DEV__) {
        console.warn('[focusSessionStore] Failed to read baseline usage for focus session start.', error);
      }
    }

    const session: FocusSession = {
      id: `${input.appFamily}-${timestamp}`,
      appFamily: input.appFamily,
      packageName: metadata.packageName,
      packageNames: metadata.packageNames,
      appName: metadata.appName,
      status: 'tracking',
      allowedUsageSeconds: toSeconds(input.allowedUsageMinutes),
      blockDurationSeconds: toSeconds(input.blockDurationMinutes),
      baselineUsageSeconds,
      consumedUsageSeconds: 0,
      warningThresholdsSent: [],
      startedAt: timestamp,
      updatedAt: timestamp,
      blockedAt: null,
      blockedUntil: null,
      completedAt: null,
    };

    const latestSessions = get().sessions;
    if (hasActiveSessionForApp(latestSessions, input.appFamily)) {
      throw new Error('A focus session is already active for this app.');
    }

    const nextSessions = [...latestSessions, session];
    persistSessions(nextSessions);
    set({ sessions: nextSessions, lastError: null });
    return session;
  },

  refreshFocusSessions: async (options = {}) => {
    const hasTrackingSession = get().sessions.some(session => session.status === 'tracking');

    set({ isRefreshing: true, lastError: null });

    try {
      if (hasTrackingSession && !options.skipUsageRefresh) {
        try {
          await fetchTodayUsage();
        } catch (error) {
          if (__DEV__) {
            console.warn('[focusSessionStore] Failed to refresh usage snapshot; falling back to elapsed tracking.', error);
          }
        }
      }

      const timestamp = now();
      let nativeLocks: Array<{ packageName: string }> = [];
      try {
        nativeLocks = await getResolvedAppLocks();
      } catch (error) {
        if (__DEV__) {
          console.warn('[focusSessionStore] Failed to read native lock state.', error);
        }
      }
      const latestSessions = get().sessions;
      const reconciled = await Promise.all(
        latestSessions.map(async session => {
          if (session.status === 'blocked' && session.blockedUntil === null) {
            const nativeLock = nativeLocks.find(lock => lock.packageName === session.packageName);
            if (!nativeLock) {
              return completeExpiredBlock(session, timestamp);
            }
          }

          return reconcileSession(session, timestamp);
        }),
      );

      persistSessions(reconciled);
      set({ sessions: reconciled, isRefreshing: false, lastError: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to refresh focus sessions.';
      set({ isRefreshing: false, lastError: message });
      throw error;
    }
  },

  completeSession: async sessionId => {
    const targetSession = get().sessions.find(session => session.id === sessionId);
    if (!targetSession) {
      return;
    }

    if (targetSession.status === 'blocked') {
      try {
        await unblockAppFamily(targetSession.packageName, 'focus');
      } catch (error) {
        if (__DEV__) {
          console.warn('[focusSessionStore] Failed to clear native focus block while ending session.', error);
        }
      }
    }

    const timestamp = now();
    const completedSession: FocusSession = {
      ...targetSession,
      status: 'completed',
      updatedAt: timestamp,
      completedAt: timestamp,
    };
    const nextSessions = replaceSession(get().sessions, completedSession);

    persistSessions(nextSessions);
    set({ sessions: nextSessions, lastError: null });
  },
}));

export function getFocusSessions(): FocusSession[] {
  return useFocusSessionStore.getState().sessions;
}

export function getActiveFocusSessions(): FocusSession[] {
  return getFocusSessions().filter(isActiveSession);
}

export function hasActiveFocusSessions(): boolean {
  return getActiveFocusSessions().length > 0;
}

export function hasTrackingFocusSessions(): boolean {
  return getFocusSessions().some(session => session.status === 'tracking');
}

export function hasTrackingFocusSessionForPackage(packageName: string): boolean {
  return getFocusSessions().some(session => (
    session.status === 'tracking' && session.packageNames.includes(packageName)
  ));
}

export async function refreshFocusSessions(options?: { skipUsageRefresh?: boolean }): Promise<void> {
  await useFocusSessionStore.getState().refreshFocusSessions(options);
}
