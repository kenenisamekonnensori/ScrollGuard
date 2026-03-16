import { NativeModules } from 'react-native';

/**
 * Usage stats payload keyed by Android package name.
 * Values represent usage time in seconds.
 */
export type UsageStatsResponse = Record<string, number>;

/**
 * Minimal contract expected from the native AppUsage module.
 */
type AppUsageModuleContract = {
  getUsageStats?: () => Promise<UsageStatsResponse>;
};

/**
 * Minimal contract expected from the native ScrollDetection module.
 */
type ScrollDetectionModuleContract = {
  startScrollDetection?: () => void;
  stopScrollDetection?: () => void;
};

/**
 * Minimal contract expected from the native AppBlocking module.
 */
type AppBlockingModuleContract = {
  blockApp?: (packageName: string, durationMinutes: number) => Promise<void>;
  unblockApp?: (packageName: string) => Promise<void>;
  isAppBlocked?: (packageName: string) => Promise<boolean>;
};

const { AppUsageModule, ScrollDetectionModule, AppBlockingModule } =
  NativeModules as {
    AppUsageModule?: AppUsageModuleContract;
    ScrollDetectionModule?: ScrollDetectionModuleContract;
    AppBlockingModule?: AppBlockingModuleContract;
  };

/**
 * Retrieves today's app usage stats from native code.
 * Placeholder behavior: returns an empty object when native module is unavailable.
 */
export async function getUsageStats(): Promise<UsageStatsResponse> {
  if (AppUsageModule?.getUsageStats) {
    return AppUsageModule.getUsageStats();
  }

  return {};
}

/**
 * Starts native scroll detection.
 * Placeholder behavior: no-op when native module is unavailable.
 */
export function startScrollDetection(): void {
  ScrollDetectionModule?.startScrollDetection?.();
}

/**
 * Stops native scroll detection.
 * Placeholder behavior: no-op when native module is unavailable.
 */
export function stopScrollDetection(): void {
  ScrollDetectionModule?.stopScrollDetection?.();
}

/**
 * Requests native layer to block an app.
 * Placeholder behavior: resolves immediately when native module is unavailable.
 */
export async function blockApp(
  packageName: string,
  durationMinutes = 0,
): Promise<void> {
  if (AppBlockingModule?.blockApp) {
    await AppBlockingModule.blockApp(packageName, durationMinutes);
  }
}

/**
 * Requests native layer to remove an app block.
 * Placeholder behavior: resolves immediately when native module is unavailable.
 */
export async function unblockApp(packageName: string): Promise<void> {
  if (AppBlockingModule?.unblockApp) {
    await AppBlockingModule.unblockApp(packageName);
  }
}

/**
 * Checks whether native layer considers an app currently blocked.
 * Placeholder behavior: returns false when native module is unavailable.
 */
export async function isAppBlocked(packageName: string): Promise<boolean> {
  if (AppBlockingModule?.isAppBlocked) {
    return AppBlockingModule.isAppBlocked(packageName);
  }

  return false;
}
