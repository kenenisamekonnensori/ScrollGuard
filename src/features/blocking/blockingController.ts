import { LockState } from '../../db/models';
import { getValue, setValue } from '../../db/storage';
import {
  blockApp as nativeBlockApp,
  getNativeLockedUntil,
  isAppBlocked as nativeIsAppBlocked,
  unblockApp as nativeUnblockApp,
} from '../../native/NativeBridgeService';
import { useSettingsStore } from '../../store/settingsStore';
import { sendLockReleasedNotification } from '../../services/NotificationService';
import {
  MONITORED_PACKAGE_GROUPS,
  MONITORED_PACKAGE_LIST,
  PACKAGE_LABELS,
} from '../../utils/appPackages';

const LOCK_STATES_STORAGE_KEY = 'lockStates';

type LockStateMap = Record<string, number>;

export type ResolvedAppLock = {
  packageName: (typeof MONITORED_PACKAGE_LIST)[number];
  appName: string;
  packageNames: readonly string[];
  lockedUntil: number | null;
  source: 'local' | 'native';
};

/**
 * Reads persisted lock states from storage.
 */
function readLockStates(): LockStateMap {
  return getValue<LockStateMap>(LOCK_STATES_STORAGE_KEY) ?? {};
}

/**
 * Persists lock states to storage.
 */
function writeLockStates(lockStates: LockStateMap): void {
  setValue(LOCK_STATES_STORAGE_KEY, lockStates);
}

/**
 * Removes expired lock entries and persists the cleaned state.
 */
function cleanupExpiredLocks(lockStates: LockStateMap): LockStateMap {
  const now = Date.now();
  let didRemoveExpiredLock = false;
  const cleaned = Object.fromEntries(
    Object.entries(lockStates).filter(([, lockedUntil]) => {
      const isActive = lockedUntil > now;
      if (!isActive) {
        didRemoveExpiredLock = true;
      }
      return isActive;
    }),
  );

  if (didRemoveExpiredLock) {
    writeLockStates(cleaned);
  }

  return cleaned;
}

/**
 * Activates a lock for an app using current settings lock duration.
 */
export async function blockApp(app: string): Promise<void> {
  const lockDurationMinutes = useSettingsStore.getState().userSettings.lockDurationMinutes;
  const lockedUntil = Date.now() + lockDurationMinutes * 60 * 1000;

  const lockStates = cleanupExpiredLocks(readLockStates());
  lockStates[app] = lockedUntil;
  writeLockStates(lockStates);

  await nativeBlockApp(app, lockDurationMinutes);
}

/**
 * Deactivates lock for an app and removes persisted state.
 */
export async function unblockApp(app: string): Promise<void> {
  const lockStates = cleanupExpiredLocks(readLockStates());
  delete lockStates[app];
  writeLockStates(lockStates);

  await nativeUnblockApp(app);
}

/**
 * Clears lock state for a canonical monitored app and all of its aliases.
 */
export async function unblockAppFamily(app: string): Promise<void> {
  const packageNames = Object.values(MONITORED_PACKAGE_GROUPS).find(group => group[0] === app) ?? [app];

  await Promise.all(packageNames.map(packageName => unblockApp(packageName)));
}

/**
 * Checks whether a specific app is currently blocked.
 */
export function isAppBlocked(app: string): boolean {
  const lockStates = cleanupExpiredLocks(readLockStates());
  const lockedUntil = lockStates[app];
  return typeof lockedUntil === 'number' && lockedUntil > Date.now();
}

/**
 * Gets lock state for a specific app if active.
 */
export function getLockState(app: string): LockState | undefined {
  const lockStates = cleanupExpiredLocks(readLockStates());
  const lockedUntil = lockStates[app];

  if (!lockedUntil) {
    return undefined;
  }

  return {
    app,
    lockedUntil,
  };
}

/**
 * Returns the first active lock state, useful for displaying lock UI.
 */
export function getActiveLockState(): LockState | undefined {
  const lockStates = cleanupExpiredLocks(readLockStates());
  const firstEntry = Object.entries(lockStates)[0];

  if (!firstEntry) {
    return undefined;
  }

  const [app, lockedUntil] = firstEntry;
  return {
    app,
    lockedUntil,
  };
}

/**
 * Resolves active monitored-app locks using persisted JS lock state first,
 * then falls back to the native blocker store to catch native-only blocks.
 */
export async function getResolvedAppLocks(): Promise<ResolvedAppLock[]> {
  const lockGroups: Array<{
    packageName: (typeof MONITORED_PACKAGE_LIST)[number];
    appName: string;
    packageNames: readonly string[];
  }> = MONITORED_PACKAGE_LIST.map(canonicalPackage => {
    const packageNames =
      Object.values(MONITORED_PACKAGE_GROUPS).find(group => group[0] === canonicalPackage)
      ?? [canonicalPackage];

    return {
      packageName: canonicalPackage,
      appName: PACKAGE_LABELS[canonicalPackage] ?? canonicalPackage,
      packageNames,
    };
  });

  const results = await Promise.all(
    lockGroups.map<Promise<ResolvedAppLock | undefined>>(async group => {
      const localLockStates = group.packageNames
        .map(packageName => getLockState(packageName))
        .filter((lockState): lockState is LockState => Boolean(lockState));

      if (localLockStates.length > 0) {
        return {
          packageName: group.packageName,
          appName: group.appName,
          packageNames: group.packageNames,
          lockedUntil: Math.max(...localLockStates.map(lockState => lockState.lockedUntil)),
          source: 'local' as const,
        };
      }

      const nativeLockTimes = await Promise.all(
        group.packageNames.map(packageName => getNativeLockedUntil(packageName)),
      );

      const activeNativeLockTimes = nativeLockTimes.filter(
        (lockedUntil): lockedUntil is number => typeof lockedUntil === 'number' && lockedUntil > Date.now(),
      );

      if (activeNativeLockTimes.length > 0) {
        return {
          packageName: group.packageName,
          appName: group.appName,
          packageNames: group.packageNames,
          lockedUntil: Math.max(...activeNativeLockTimes),
          source: 'native' as const,
        };
      }

      const nativeStates = await Promise.all(
        group.packageNames.map(packageName => nativeIsAppBlocked(packageName)),
      );

      if (nativeStates.some(Boolean)) {
        return {
          packageName: group.packageName,
          appName: group.appName,
          packageNames: group.packageNames,
          lockedUntil: null,
          source: 'native' as const,
        };
      }

      return undefined;
    }),
  );

  return results
    .filter((result): result is ResolvedAppLock => result !== undefined)
    .sort((first, second) => {
      const firstSortValue = first.lockedUntil ?? Number.MAX_SAFE_INTEGER;
      const secondSortValue = second.lockedUntil ?? Number.MAX_SAFE_INTEGER;
      return firstSortValue - secondSortValue;
    });
}

/**
 * Proactively clears expired monitored-app locks so the native blocker
 * and local state stay in sync even without manual user interaction.
 */
export async function reconcileExpiredLocks(): Promise<void> {
  const rawLockStates = readLockStates();
  const now = Date.now();

  await Promise.all(
    MONITORED_PACKAGE_LIST.map(async canonicalPackage => {
      const packageNames =
        Object.values(MONITORED_PACKAGE_GROUPS).find(group => group[0] === canonicalPackage)
        ?? [canonicalPackage];
      const hadStoredLock = packageNames.some(packageName => {
        const lockedUntil = rawLockStates[packageName];
        return typeof lockedUntil === 'number' && lockedUntil <= now;
      });

      const nativeLockTimes = await Promise.all(
        packageNames.map(packageName => getNativeLockedUntil(packageName)),
      );
      const hasActiveNativeLock = nativeLockTimes.some(
        lockedUntil => typeof lockedUntil === 'number' && lockedUntil > now,
      );

      if (hadStoredLock && !hasActiveNativeLock) {
        await unblockAppFamily(canonicalPackage);
        sendLockReleasedNotification(PACKAGE_LABELS[canonicalPackage] ?? canonicalPackage);
      }
    }),
  );
}
