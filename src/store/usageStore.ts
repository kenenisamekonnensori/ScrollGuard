import { create } from 'zustand';
import { getValue, setValue } from '../db/storage';

const USAGE_STATS_STORAGE_KEY = 'usageStats';
const VIDEO_COUNTS_STORAGE_KEY = 'videoCounts';

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
 * Shape of the usage store state and actions.
 */
interface UsageState {
  usageStats: UsageStats;
  videoCounts: VideoCounts;
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

/**
 * Global usage store for app time tracking and short-video counters.
 * Initializes from MMKV and persists every update back to MMKV.
 */
export const useUsageStore = create<UsageState>(set => ({
  usageStats: getInitialUsageStats(),
  videoCounts: getInitialVideoCounts(),

  /**
   * Sets/updates the usage time (seconds) for a specific app and persists it.
   */
  updateUsage: (app, timeSpentSeconds) => {
    set(state => {
      const nextUsageStats: UsageStats = {
        ...state.usageStats,
        [app]: timeSpentSeconds,
      };

      setValue(USAGE_STATS_STORAGE_KEY, nextUsageStats);
      return { usageStats: nextUsageStats };
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

      setValue(VIDEO_COUNTS_STORAGE_KEY, nextVideoCounts);
      return { videoCounts: nextVideoCounts };
    });
  },
}));
