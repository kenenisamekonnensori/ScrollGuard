import { LockState } from '../../db/models';
import { getValue, setValue } from '../../db/storage';
import {
  blockApp as nativeBlockApp,
  unblockApp as nativeUnblockApp,
} from '../../native/NativeBridgeService';
import { useSettingsStore } from '../../store/settingsStore';

const LOCK_STATES_STORAGE_KEY = 'lockStates';

type LockStateMap = Record<string, number>;

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
