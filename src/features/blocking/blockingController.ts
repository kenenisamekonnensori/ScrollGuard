import { LockState } from '../../db/models';
import { getValue, setValue } from '../../db/storage';
import {
  blockApp as nativeBlockApp,
  getNativeLockedUntil,
  isAppBlocked as nativeIsAppBlocked,
  unblockApp as nativeUnblockApp,
} from '../../native/NativeBridgeService';
import { useSettingsStore } from '../../store/settingsStore';
import { sendLockReleasedNotification, sendLimitReachedNotification } from '../../services/NotificationService';
import {
  MONITORED_PACKAGE_ALIAS_LIST,
  MONITORED_PACKAGE_GROUPS,
  MONITORED_PACKAGE_LIST,
  LIMIT_SETTING_KEYS,
  PACKAGE_LABELS,
  resolveCanonicalPackageName,
} from '../../utils/appPackages';

const LOCK_STATES_STORAGE_KEY = 'lockStates';
const BLOCK_HISTORY_STORAGE_KEY = 'blockHistory';

type LockSource = 'focus' | 'dailyLimit';

type LockSourceState = Partial<Record<LockSource, number>>;

type StoredLockStates = Record<string, number | LockSourceState>;

type LockStateMap = Record<string, LockSourceState>;

type BlockHistoryItem = {
  id: string;
  app: string;
  source: LockSource;
  durationMinutes: number;
  createdAt: number;
};

export type ResolvedAppLock = {
  packageName: (typeof MONITORED_PACKAGE_LIST)[number];
  appName: string;
  packageNames: readonly string[];
  lockedUntil: number | null;
  source: 'local' | 'native';
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeLockedUntil(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= Date.now()) {
    return undefined;
  }

  return Math.floor(value);
}

function getPackageGroup(app: string): readonly string[] {
  const packageGroups: readonly (readonly string[])[] = Object.values(MONITORED_PACKAGE_GROUPS);
  return packageGroups.find(group => group.includes(app)) ?? [app];
}

function normalizeLockSourceState(value: unknown): LockSourceState {
  if (typeof value === 'number') {
    const legacyLockedUntil = sanitizeLockedUntil(value);
    return legacyLockedUntil ? { focus: legacyLockedUntil } : {};
  }

  if (!isObjectRecord(value)) {
    return {};
  }

  const normalized: LockSourceState = {};
  const focusLockedUntil = sanitizeLockedUntil(value.focus);
  const dailyLimitLockedUntil = sanitizeLockedUntil(value.dailyLimit);

  if (focusLockedUntil) {
    normalized.focus = focusLockedUntil;
  }

  if (dailyLimitLockedUntil) {
    normalized.dailyLimit = dailyLimitLockedUntil;
  }

  return normalized;
}

function readLockStates(): LockStateMap {
  const persisted = getValue<StoredLockStates | undefined>(LOCK_STATES_STORAGE_KEY);

  if (!persisted) {
    return {};
  }

  return Object.entries(persisted).reduce<LockStateMap>((accumulator, [app, value]) => {
    const normalized = normalizeLockSourceState(value);
    if (Object.keys(normalized).length > 0) {
      accumulator[app] = normalized;
    }

    return accumulator;
  }, {});
}

function writeLockStates(lockStates: LockStateMap): void {
  setValue(LOCK_STATES_STORAGE_KEY, lockStates);
}

function readBlockHistory(): BlockHistoryItem[] {
  const persisted = getValue<unknown>(BLOCK_HISTORY_STORAGE_KEY);
  if (!Array.isArray(persisted)) {
    return [];
  }

  return persisted.filter((item): item is BlockHistoryItem => {
    if (!isObjectRecord(item)) {
      return false;
    }

    return (
      typeof item.id === 'string'
      && typeof item.app === 'string'
      && (item.source === 'focus' || item.source === 'dailyLimit')
      && typeof item.durationMinutes === 'number'
      && Number.isFinite(item.durationMinutes)
      && item.durationMinutes > 0
      && typeof item.createdAt === 'number'
      && Number.isFinite(item.createdAt)
    );
  });
}

function writeBlockHistory(history: BlockHistoryItem[]): void {
  setValue(BLOCK_HISTORY_STORAGE_KEY, history.slice(-200));
}

function recordBlockHistory(app: string, source: LockSource, durationMinutes: number): void {
  if (app !== resolveCanonicalPackageName(app)) {
    return;
  }

  const currentHistory = readBlockHistory();
  const createdAt = Date.now();
  const item: BlockHistoryItem = {
    id: `${app}-${source}-${createdAt}`,
    app,
    source,
    durationMinutes,
    createdAt,
  };

  currentHistory.push(item);
  writeBlockHistory(currentHistory);
}

function pruneExpiredSources(lockState: LockSourceState, now = Date.now()): LockSourceState {
  const nextState: LockSourceState = {};

  (['focus', 'dailyLimit'] as LockSource[]).forEach(source => {
    const lockedUntil = lockState[source];
    if (typeof lockedUntil === 'number' && lockedUntil > now) {
      nextState[source] = lockedUntil;
    }
  });

  return nextState;
}

function getOverallLockedUntil(lockState: LockSourceState, now = Date.now()): number | null {
  const activeLockTimes = Object.values(lockState).filter(
    (lockedUntil): lockedUntil is number => typeof lockedUntil === 'number' && lockedUntil > now,
  );

  if (activeLockTimes.length === 0) {
    return null;
  }

  return Math.max(...activeLockTimes);
}

async function syncNativeLock(app: string, lockState: LockSourceState): Promise<void> {
  const lockedUntil = getOverallLockedUntil(lockState);

  if (!lockedUntil) {
    await nativeUnblockApp(app);
    return;
  }

  const remainingMinutes = Math.max(Math.ceil((lockedUntil - Date.now()) / 60_000), 1);
  await nativeBlockApp(app, remainingMinutes);
}

async function persistAndSyncAppLock(app: string, nextState: LockSourceState): Promise<void> {
  const lockStates = readLockStates();

  if (Object.keys(nextState).length > 0) {
    lockStates[app] = nextState;
  } else {
    delete lockStates[app];
  }

  writeLockStates(lockStates);
  await syncNativeLock(app, nextState);
}

function hasActiveLockSource(app: string, source: LockSource): boolean {
  const lockState = pruneExpiredSources(readLockStates()[app] ?? {});
  return typeof lockState[source] === 'number' && lockState[source] > Date.now();
}

/**
 * Activates a lock for an app using the current settings lock duration.
 */
export async function blockApp(
  app: string,
  durationMinutes?: number,
  source: LockSource = 'focus',
): Promise<void> {
  const lockDurationMinutes =
    durationMinutes ?? useSettingsStore.getState().userSettings.lockDurationMinutes;
  const lockedUntil = Date.now() + lockDurationMinutes * 60 * 1000;
  const currentState = pruneExpiredSources(readLockStates()[app] ?? {});

  await persistAndSyncAppLock(app, {
    ...currentState,
    [source]: lockedUntil,
  });

  recordBlockHistory(app, source, lockDurationMinutes);
}

/**
 * Deactivates a lock source for an app and keeps any remaining sources active.
 */
export async function unblockApp(app: string, source: LockSource = 'focus'): Promise<void> {
  const currentState = pruneExpiredSources(readLockStates()[app] ?? {});
  const nextState = { ...currentState };
  delete nextState[source];

  await persistAndSyncAppLock(app, nextState);
}

/**
 * Clears a lock source for a monitored family and all of its aliases.
 */
export async function unblockAppFamily(app: string, source: LockSource = 'focus'): Promise<void> {
  const packageNames = getPackageGroup(app);
  await Promise.all(packageNames.map(packageName => unblockApp(packageName, source)));
}

/**
 * Clears a lock source from every monitored package and alias.
 */
export async function clearLockSourceForAllApps(source: LockSource): Promise<void> {
  await Promise.all(MONITORED_PACKAGE_ALIAS_LIST.map(packageName => unblockApp(packageName, source)));
}

/**
 * Checks whether a specific app is currently blocked.
 */
export function isAppBlocked(app: string): boolean {
  const lockState = pruneExpiredSources(readLockStates()[app] ?? {});
  return getOverallLockedUntil(lockState) !== null;
}

/**
 * Gets lock state for a specific app if active.
 */
export function getLockState(app: string): LockState | undefined {
  const lockState = pruneExpiredSources(readLockStates()[app] ?? {});
  const lockedUntil = getOverallLockedUntil(lockState);

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
  const lockStates = readLockStates();
  const firstEntry = Object.entries(lockStates)[0];

  if (!firstEntry) {
    return undefined;
  }

  const [app, lockState] = firstEntry;
  const lockedUntil = getOverallLockedUntil(pruneExpiredSources(lockState));

  if (!lockedUntil) {
    return undefined;
  }

  return {
    app,
    lockedUntil,
  };
}

/**
 * Returns active monitored-app locks using persisted local state first,
 * then falls back to the native blocker store to catch native-only blocks.
 */
export async function getResolvedAppLocks(): Promise<ResolvedAppLock[]> {
  const lockGroups: Array<{
    packageName: (typeof MONITORED_PACKAGE_LIST)[number];
    appName: string;
    packageNames: readonly string[];
  }> = MONITORED_PACKAGE_LIST.map(canonicalPackage => {
    const packageNames = getPackageGroup(canonicalPackage);

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
 * Proactively clears expired locks so the native blocker and local state stay in sync.
 */
export async function reconcileExpiredLocks(): Promise<void> {
  const currentLockStates = readLockStates();
  const nextLockStates: LockStateMap = {};
  const now = Date.now();

  for (const canonicalPackage of MONITORED_PACKAGE_LIST) {
    const packageNames = getPackageGroup(canonicalPackage);
    let hadActiveLock = false;
    let hasActiveLock = false;

    for (const packageName of packageNames) {
      const previousState = currentLockStates[packageName];

      if (!previousState) {
        continue;
      }

      const cleanedState = pruneExpiredSources(previousState, now);

      if (getOverallLockedUntil(previousState, now) !== null) {
        hadActiveLock = true;
      }

      if (getOverallLockedUntil(cleanedState, now) !== null) {
        hasActiveLock = true;
        nextLockStates[packageName] = cleanedState;
      }

      await syncNativeLock(packageName, cleanedState);
    }

    if (hadActiveLock && !hasActiveLock) {
      sendLockReleasedNotification(PACKAGE_LABELS[canonicalPackage] ?? canonicalPackage);
    }
  }

  writeLockStates(nextLockStates);
}

/**
 * Enforces the currently started daily limits against tracked usage.
 */
export async function enforceDailyLimitBlocks(
  usageStats: Record<string, number>,
): Promise<void> {
  const { userSettings } = useSettingsStore.getState();

  if (!userSettings.dailyLimitEnabled) {
    return;
  }

  for (const canonicalPackage of MONITORED_PACKAGE_LIST) {
    const limitMinutes = userSettings[LIMIT_SETTING_KEYS[canonicalPackage]];
    const usageSeconds = usageStats[canonicalPackage] ?? 0;
    const packageNames = getPackageGroup(canonicalPackage);
    const overLimit = usageSeconds >= limitMinutes * 60;
    const hasActiveDailyLimit = packageNames.some(packageName =>
      hasActiveLockSource(packageName, 'dailyLimit'),
    );

    if (!overLimit) {
      continue;
    }

    const missingDailyLimitBlocks = packageNames.filter(
      packageName => !hasActiveLockSource(packageName, 'dailyLimit'),
    );

    if (missingDailyLimitBlocks.length === 0) {
      continue;
    }

    await Promise.all(
      missingDailyLimitBlocks.map(packageName => blockApp(packageName, undefined, 'dailyLimit')),
    );

    if (!hasActiveDailyLimit) {
      sendLimitReachedNotification(PACKAGE_LABELS[canonicalPackage] ?? canonicalPackage);
    }
  }
}

export function getBlockHistory(): BlockHistoryItem[] {
  return readBlockHistory().sort((first, second) => first.createdAt - second.createdAt);
}
