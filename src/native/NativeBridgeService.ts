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
  getLockedUntil?: (packageName: string) => Promise<number | null>;
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

export type PermissionStatusSupport = {
  usageAccess: boolean;
  accessibility: boolean;
  notifications: boolean;
};

export type PermissionStatusSnapshot = {
  support: PermissionStatusSupport;
  usageAccess: boolean;
  accessibility: boolean;
  notifications: boolean;
  totalRequiredPermissions: number;
  completedPermissionsCount: number;
  completionPercent: number;
  allRequiredPermissionsEnabled: boolean;
};

function getAppUsageModule(): AppUsageModuleContract | undefined {
  return (NativeModules as { AppUsageModule?: AppUsageModuleContract }).AppUsageModule;
}

function getScrollDetectionModule(): ScrollDetectionModuleContract | undefined {
  return (NativeModules as { ScrollDetectionModule?: ScrollDetectionModuleContract })
    .ScrollDetectionModule;
}

function getAppBlockingModule(): AppBlockingModuleContract | undefined {
  return (NativeModules as { AppBlockingModule?: AppBlockingModuleContract }).AppBlockingModule;
}

let usageAccessFallbackCache: { value: boolean; atMs: number } | null = null;
const USAGE_ACCESS_FALLBACK_CACHE_MS = 30_000;

/**
 * Returns permission-status capability checks at call-time.
 * This avoids stale false negatives that can happen when native modules are initialized after import time.
 */
export function getPermissionStatusSupport(): PermissionStatusSupport {
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

export async function getPermissionSnapshot(): Promise<PermissionStatusSnapshot> {
  const support = getPermissionStatusSupport();
  const isAndroid = Platform.OS === 'android';

  const permissionResults = await Promise.allSettled([
    hasUsageAccessPermission({ allowExpensiveFallback: true }),
    isAccessibilityServiceEnabled(),
    areNotificationsEnabled(),
  ]);

  const usageAccess =
    permissionResults[0].status === 'fulfilled' ? permissionResults[0].value : false;
  const accessibility =
    permissionResults[1].status === 'fulfilled' ? permissionResults[1].value : false;
  const notifications =
    permissionResults[2].status === 'fulfilled' ? permissionResults[2].value : false;

  const usageAccessSupported = !isAndroid || support.usageAccess;
  const accessibilitySupported = !isAndroid || support.accessibility;
  const notificationsSupported = support.notifications;

  const totalRequiredPermissions =
    (isAndroid && usageAccessSupported ? 1 : 0)
    + (isAndroid && accessibilitySupported ? 1 : 0)
    + (notificationsSupported ? 1 : 0);
  const completedPermissionsCount =
    (isAndroid && usageAccessSupported && usageAccess ? 1 : 0)
    + (isAndroid && accessibilitySupported && accessibility ? 1 : 0)
    + (notificationsSupported && notifications ? 1 : 0);
  const completionPercent =
    totalRequiredPermissions > 0
      ? Math.round((completedPermissionsCount / totalRequiredPermissions) * 100)
      : 100;

  return {
    support,
    usageAccess,
    accessibility,
    notifications,
    totalRequiredPermissions,
    completedPermissionsCount,
    completionPercent,
    allRequiredPermissionsEnabled: completedPermissionsCount === totalRequiredPermissions,
  };
}

/**
 * Retrieves today's app usage stats from native code.
 * Throws when native usage is unavailable so callers do not persist empty fallback data.
 */
export async function getUsageStats(): Promise<UsageStatsResponse> {
  const appUsageModule = getAppUsageModule();

  if (appUsageModule?.getUsageStats) {
    return appUsageModule.getUsageStats();
  }

  throw new Error('AppUsageModule.getUsageStats is unavailable.');
}

/**
 * Checks whether Android Usage Access permission is granted.
 * Returns false if native status API is unavailable.
 */
export async function hasUsageAccessPermission(options?: { allowExpensiveFallback?: boolean }): Promise<boolean> {
  const allowExpensiveFallback = options?.allowExpensiveFallback ?? true;

  const appUsageModule = getAppUsageModule();

  if (appUsageModule?.hasUsageAccessPermission) {
    return appUsageModule.hasUsageAccessPermission();
  }

  // Fallback path for older native binaries where explicit permission-status API is not exposed yet.
  // If usage stats call succeeds, usage access is effectively granted.
  if (allowExpensiveFallback && appUsageModule?.getUsageStats) {
    const now = Date.now();
    if (usageAccessFallbackCache && now - usageAccessFallbackCache.atMs < USAGE_ACCESS_FALLBACK_CACHE_MS) {
      return usageAccessFallbackCache.value;
    }

    try {
      await appUsageModule.getUsageStats();
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
  const appUsageModule = getAppUsageModule();

  if (appUsageModule?.areNotificationsEnabled) {
    return appUsageModule.areNotificationsEnabled();
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
  getScrollDetectionModule()?.startScrollDetection?.();
}

/**
 * Stops native scroll detection.
 * Placeholder behavior: no-op when native module is unavailable.
 */
export function stopScrollDetection(): void {
  getScrollDetectionModule()?.stopScrollDetection?.();
}

/**
 * Starts native foreground service that keeps blocker protection alive in background.
 */
export function startForegroundProtectionService(): void {
  getScrollDetectionModule()?.startForegroundProtectionService?.();
}

/**
 * Stops native foreground protection service.
 */
export function stopForegroundProtectionService(): void {
  getScrollDetectionModule()?.stopForegroundProtectionService?.();
}

/**
 * Checks whether ScrollGuard accessibility service is enabled.
 * Returns false if native status API is unavailable.
 */
export async function isAccessibilityServiceEnabled(): Promise<boolean> {
  const scrollDetectionModule = getScrollDetectionModule();

  if (scrollDetectionModule?.isAccessibilityServiceEnabled) {
    return scrollDetectionModule.isAccessibilityServiceEnabled();
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
  const appBlockingModule = getAppBlockingModule();

  if (appBlockingModule?.blockApp) {
    await appBlockingModule.blockApp(packageName, durationMinutes);
  }
}

/**
 * Requests native layer to remove an app block.
 * Placeholder behavior: resolves immediately when native module is unavailable.
 */
export async function unblockApp(packageName: string): Promise<void> {
  const appBlockingModule = getAppBlockingModule();

  if (appBlockingModule?.unblockApp) {
    await appBlockingModule.unblockApp(packageName);
  }
}

/**
 * Checks whether native layer considers an app currently blocked.
 * Placeholder behavior: returns false when native module is unavailable.
 */
export async function isAppBlocked(packageName: string): Promise<boolean> {
  const appBlockingModule = getAppBlockingModule();

  if (appBlockingModule?.isAppBlocked) {
    return appBlockingModule.isAppBlocked(packageName);
  }

  return false;
}

/**
 * Reads the active native lock expiry timestamp for an app.
 * Returns null when the app is not blocked or the native module is unavailable.
 */
export async function getNativeLockedUntil(packageName: string): Promise<number | null> {
  const appBlockingModule = getAppBlockingModule();

  if (appBlockingModule?.getLockedUntil) {
    return appBlockingModule.getLockedUntil(packageName);
  }

  return null;
}
