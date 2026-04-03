import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

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
  hasUsageAccessPermission?: () => Promise<boolean>;
  areNotificationsEnabled?: () => Promise<boolean>;
};

/**
 * Minimal contract expected from the native ScrollDetection module.
 */
type ScrollDetectionModuleContract = {
  startScrollDetection?: () => void;
  stopScrollDetection?: () => void;
  startForegroundProtectionService?: () => void;
  stopForegroundProtectionService?: () => void;
  isAccessibilityServiceEnabled?: () => Promise<boolean>;
};

/**
 * Minimal contract expected from the native AppBlocking module.
 */
type AppBlockingModuleContract = {
  blockApp?: (packageName: string, durationMinutes: number) => Promise<void>;
  unblockApp?: (packageName: string) => Promise<void>;
  isAppBlocked?: (packageName: string) => Promise<boolean>;
};

type IOSNotificationPermissions = {
  alert?: boolean;
  badge?: boolean;
  sound?: boolean;
  authorizationStatus?: number;
};

type PushNotificationManagerIOSContract = {
  checkPermissions?: (callback: (permissions: IOSNotificationPermissions) => void) => void;
};

const { AppUsageModule, ScrollDetectionModule, AppBlockingModule } =
  NativeModules as {
    AppUsageModule?: AppUsageModuleContract;
    ScrollDetectionModule?: ScrollDetectionModuleContract;
    AppBlockingModule?: AppBlockingModuleContract;
  };

let usageAccessFallbackCache: { value: boolean; atMs: number } | null = null;
const USAGE_ACCESS_FALLBACK_CACHE_MS = 30_000;

/**
 * Returns permission-status capability checks at call-time.
 * This avoids stale false negatives that can happen when native modules are initialized after import time.
 */
export function getPermissionStatusSupport(): {
  usageAccess: boolean;
  accessibility: boolean;
  notifications: boolean;
} {
  const appUsageModule = NativeModules.AppUsageModule as AppUsageModuleContract | undefined;
  const scrollDetectionModule = NativeModules.ScrollDetectionModule as ScrollDetectionModuleContract | undefined;
  const pushNotificationManager =
    NativeModules.PushNotificationManager as PushNotificationManagerIOSContract | undefined;

  const androidNotificationSupport =
    Boolean(appUsageModule?.areNotificationsEnabled)
    || (Platform.OS === 'android'
      && typeof Platform.Version === 'number'
      && Platform.Version >= 33);
  const iosNotificationSupport =
    Platform.OS === 'ios' && Boolean(pushNotificationManager?.checkPermissions);

  return {
    usageAccess: Boolean(appUsageModule?.hasUsageAccessPermission || appUsageModule?.getUsageStats),
    accessibility: Boolean(scrollDetectionModule?.isAccessibilityServiceEnabled),
    notifications: androidNotificationSupport || iosNotificationSupport,
  };
}

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
 * Checks whether Android Usage Access permission is granted.
 * Returns false if native status API is unavailable.
 */
export async function hasUsageAccessPermission(options?: { allowExpensiveFallback?: boolean }): Promise<boolean> {
  const allowExpensiveFallback = options?.allowExpensiveFallback ?? true;

  if (AppUsageModule?.hasUsageAccessPermission) {
    return AppUsageModule.hasUsageAccessPermission();
  }

  // Fallback path for older native binaries where explicit permission-status API is not exposed yet.
  // If usage stats call succeeds, usage access is effectively granted.
  if (allowExpensiveFallback && AppUsageModule?.getUsageStats) {
    const now = Date.now();
    if (usageAccessFallbackCache && now - usageAccessFallbackCache.atMs < USAGE_ACCESS_FALLBACK_CACHE_MS) {
      return usageAccessFallbackCache.value;
    }

    try {
      await AppUsageModule.getUsageStats();
      usageAccessFallbackCache = { value: true, atMs: now };
      return true;
    } catch {
      usageAccessFallbackCache = { value: false, atMs: now };
      return false;
    }
  }

  return false;
}

/**
 * Checks whether app notifications are currently enabled.
 * Returns false if native status API is unavailable.
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  if (AppUsageModule?.areNotificationsEnabled) {
    return AppUsageModule.areNotificationsEnabled();
  }

  // Fallback for Android builds without native notification-status API.
  if (Platform.OS === 'android') {
    if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        return result;
      } catch {
        return false;
      }
    }

    // Android < 13 without native status API is treated as unsupported by getPermissionStatusSupport().
    return false;
  }

  if (Platform.OS === 'ios') {
    const pushNotificationManager =
      NativeModules.PushNotificationManager as PushNotificationManagerIOSContract | undefined;

    if (pushNotificationManager?.checkPermissions) {
      return new Promise(resolve => {
        pushNotificationManager.checkPermissions?.(permissions => {
          const enabled = Boolean(
            permissions.alert
              || permissions.badge
              || permissions.sound
              || (typeof permissions.authorizationStatus === 'number' && permissions.authorizationStatus > 0),
          );
          resolve(enabled);
        });
      });
    }
  }

  return false;
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
 * Starts native foreground service that keeps blocker protection alive in background.
 */
export function startForegroundProtectionService(): void {
  ScrollDetectionModule?.startForegroundProtectionService?.();
}

/**
 * Stops native foreground protection service.
 */
export function stopForegroundProtectionService(): void {
  ScrollDetectionModule?.stopForegroundProtectionService?.();
}

/**
 * Checks whether ScrollGuard accessibility service is enabled.
 * Returns false if native status API is unavailable.
 */
export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  if (ScrollDetectionModule?.isAccessibilityServiceEnabled) {
    return ScrollDetectionModule.isAccessibilityServiceEnabled();
  }

  return false;
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
