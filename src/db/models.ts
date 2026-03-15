/**
 * User-configurable daily limits and lock behavior for supported apps.
 */
export interface UserSettings {
  tiktokLimitMinutes: number;
  instagramLimitMinutes: number;
  youtubeLimitMinutes: number;
  lockDurationMinutes: number;
}

/**
 * Aggregated usage metrics for a single app on a single day.
 */
export interface DailyUsage {
  date: string;
  app: string;
  timeSpentSeconds: number;
  videoCount: number;
}

/**
 * Active lock information for an app until a UNIX timestamp in milliseconds.
 */
export interface LockState {
  app: string;
  lockedUntil: number;
}
