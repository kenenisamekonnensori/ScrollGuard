import { create } from 'zustand';
import { getValue, setValue } from '../db/storage';

const USAGE_STATS_STORAGE_KEY = 'usageStats';
const VIDEO_COUNTS_STORAGE_KEY = 'videoCounts';
const DAILY_USAGE_HISTORY_STORAGE_KEY = 'dailyUsageHistory';
const MAX_DAILY_HISTORY_DAYS = 7;

/**
 * Per-app usage time in seconds.
 * Example: { "com.instagram.android": 1200 }
 */
type UsageStats = Record<string, number>;

/**
 * Per-app counted short video swipes.
 * Example: { "com.zhiliaoapp.musically": 42 }
 */
type VideoCounts = Record<string, number>;

/**
 * Local daily snapshot used for weekly analytics without backend dependency.
 */
export interface DailyUsageSnapshot {
  date: string;
  usageStats: UsageStats;
  videoCounts: VideoCounts;
  totalSeconds: number;
  totalVideos: number;
}

/**
 * Shape of the usage store state and actions.
 */
interface UsageState {
  usageStats: UsageStats;
  videoCounts: VideoCounts;
  dailyHistory: DailyUsageSnapshot[];
  lastSyncedAt: number | null;
  setUsageStats: (usageStats: UsageStats) => void;
  setVideoCounts: (videoCounts: VideoCounts) => void;
  setLastSyncedAt: (timestamp: number | null) => void;
  updateUsage: (app: string, timeSpentSeconds: number) => void;
  incrementVideoCount: (app: string) => void;
}

/**
 * Reads persisted usage stats from MMKV, defaulting to an empty object.
 */
function getInitialUsageStats(): UsageStats {
  return getValue<UsageStats>(USAGE_STATS_STORAGE_KEY) ?? {};
}

/**
 * Reads persisted video counts from MMKV, defaulting to an empty object.
 */
function getInitialVideoCounts(): VideoCounts {
  return getValue<VideoCounts>(VIDEO_COUNTS_STORAGE_KEY) ?? {};
}

function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toSafeWholeNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

function sanitizeNumericMap(value: unknown): Record<string, number> {
  if (!isObjectRecord(value)) {
    return {};
  }

  const output: Record<string, number> = {};
  Object.entries(value).forEach(([key, rawValue]) => {
    output[key] = toSafeWholeNumber(rawValue);
  });

  return output;
}

function sumRecordValues(record: Record<string, number>): number {
  return Object.values(record).reduce((total, value) => {
    if (!Number.isFinite(value) || value < 0) {
      return total;
    }

    return total + Math.floor(value);
  }, 0);
}

function normalizeDailyHistory(history: DailyUsageSnapshot[]): DailyUsageSnapshot[] {
  return history
    .filter(snapshot => typeof snapshot.date === 'string' && snapshot.date.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_DAILY_HISTORY_DAYS);
}

function sanitizeDailySnapshot(rawSnapshot: unknown): DailyUsageSnapshot | undefined {
  if (!isObjectRecord(rawSnapshot)) {
    return undefined;
  }

  const dateValue = rawSnapshot.date;
  if (typeof dateValue !== 'string' || dateValue.length === 0) {
    return undefined;
  }

  // Accept only canonical local date format (YYYY-MM-DD) for stable sorting/comparison.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return undefined;
  }

  const usageStats = sanitizeNumericMap(rawSnapshot.usageStats);
  const videoCounts = sanitizeNumericMap(rawSnapshot.videoCounts);

  const fallbackTotalSeconds = sumRecordValues(usageStats);
  const fallbackTotalVideos = sumRecordValues(videoCounts);

  const totalSeconds =
    toSafeWholeNumber(rawSnapshot.totalSeconds) > 0
      ? toSafeWholeNumber(rawSnapshot.totalSeconds)
      : fallbackTotalSeconds;
  const totalVideos =
    toSafeWholeNumber(rawSnapshot.totalVideos) > 0
      ? toSafeWholeNumber(rawSnapshot.totalVideos)
      : fallbackTotalVideos;

  return {
    date: dateValue,
    usageStats,
    videoCounts,
    totalSeconds,
    totalVideos,
  };
}

function sanitizeDailyHistory(value: unknown): DailyUsageSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const sanitized = value
    .map(item => sanitizeDailySnapshot(item))
    .filter((item): item is DailyUsageSnapshot => Boolean(item));

  return normalizeDailyHistory(sanitized);
}

function getInitialDailyHistory(): DailyUsageSnapshot[] {
  const persisted = getValue<unknown>(DAILY_USAGE_HISTORY_STORAGE_KEY);
  if (!persisted) {
    return [];
  }

  return sanitizeDailyHistory(persisted);
}

function buildUpdatedHistory(
  currentHistory: DailyUsageSnapshot[],
  usageStats: UsageStats,
  videoCounts: VideoCounts,
  dateKey = getLocalDateKey(),
): DailyUsageSnapshot[] {
  const nextSnapshot: DailyUsageSnapshot = {
    date: dateKey,
    usageStats,
    videoCounts,
    totalSeconds: sumRecordValues(usageStats),
    totalVideos: sumRecordValues(videoCounts),
  };

  const withoutTargetDate = currentHistory.filter(snapshot => snapshot.date !== dateKey);
  return normalizeDailyHistory([...withoutTargetDate, nextSnapshot]);
}

export const __usageStoreInternals = {
  buildUpdatedHistory,
  sanitizeDailyHistory,
};

/**
 * Global usage store for app time tracking and short-video counters.
 * Initializes from MMKV and persists every update back to MMKV.
 */
export const useUsageStore = create<UsageState>(set => ({
  usageStats: getInitialUsageStats(),
  videoCounts: getInitialVideoCounts(),
  dailyHistory: getInitialDailyHistory(),
  lastSyncedAt: null,

  /**
   * Replaces all usage stats in one operation and persists once.
   */
  setUsageStats: usageStats => {
    set(state => {
      const nextHistory = buildUpdatedHistory(state.dailyHistory, usageStats, state.videoCounts);
      setValue(USAGE_STATS_STORAGE_KEY, usageStats);
      setValue(DAILY_USAGE_HISTORY_STORAGE_KEY, nextHistory);
      return {
        usageStats,
        dailyHistory: nextHistory,
      };
    });
  },

  /**
   * Replaces all video counts in one operation and persists once.
   */
  setVideoCounts: videoCounts => {
    set(state => {
      const nextHistory = buildUpdatedHistory(state.dailyHistory, state.usageStats, videoCounts);
      setValue(VIDEO_COUNTS_STORAGE_KEY, videoCounts);
      setValue(DAILY_USAGE_HISTORY_STORAGE_KEY, nextHistory);
      return {
        videoCounts,
        dailyHistory: nextHistory,
      };
    });
  },

  setLastSyncedAt: lastSyncedAt => {
    set({ lastSyncedAt });
  },

  /**
   * Sets/updates the usage time (seconds) for a specific app and persists it.
   */
  updateUsage: (app, timeSpentSeconds) => {
    set(state => {
      const nextUsageStats: UsageStats = {
        ...state.usageStats,
        [app]: timeSpentSeconds,
      };
      const nextHistory = buildUpdatedHistory(state.dailyHistory, nextUsageStats, state.videoCounts);

      setValue(USAGE_STATS_STORAGE_KEY, nextUsageStats);
      setValue(DAILY_USAGE_HISTORY_STORAGE_KEY, nextHistory);
      return {
        usageStats: nextUsageStats,
        dailyHistory: nextHistory,
      };
    });
  },

  /**
   * Increments a specific app's short-video counter by one and persists it.
   */
  incrementVideoCount: app => {
    set(state => {
      const currentCount = state.videoCounts[app] ?? 0;
      const nextVideoCounts: VideoCounts = {
        ...state.videoCounts,
        [app]: currentCount + 1,
      };
      const nextHistory = buildUpdatedHistory(state.dailyHistory, state.usageStats, nextVideoCounts);

      setValue(VIDEO_COUNTS_STORAGE_KEY, nextVideoCounts);
      setValue(DAILY_USAGE_HISTORY_STORAGE_KEY, nextHistory);
      return {
        videoCounts: nextVideoCounts,
        dailyHistory: nextHistory,
      };
    });
  },
}));
