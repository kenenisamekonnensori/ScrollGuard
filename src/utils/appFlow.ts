import { getPermissionSnapshot } from '../native/NativeBridgeService';
import { getValue, setValue } from '../db/storage';

const ONBOARDING_COMPLETED_STORAGE_KEY = 'appFlow.onboardingCompleted';
const LAST_ACTIVE_AT_STORAGE_KEY = 'appFlow.lastActiveAt';

export const RECENT_INACTIVITY_THRESHOLD_MS = 30 * 60 * 1000;
export const RETURN_SPLASH_MIN_DURATION_MS = 1100;

export type AppEntryRoute =
  | 'OnboardingScreen'
  | 'PermissionsSetupScreen'
  | 'MainTabs';

export function hasCompletedOnboarding(): boolean {
  return getValue<boolean>(ONBOARDING_COMPLETED_STORAGE_KEY) ?? false;
}

export function setOnboardingCompleted(isCompleted: boolean): void {
  setValue(ONBOARDING_COMPLETED_STORAGE_KEY, isCompleted);
}

export function getLastActiveAt(): number | undefined {
  return getValue<number>(LAST_ACTIVE_AT_STORAGE_KEY);
}

export function setLastActiveAt(timestampMs = Date.now()): void {
  setValue(LAST_ACTIVE_AT_STORAGE_KEY, timestampMs);
}

export function shouldShowSplashAfterInactivity(
  lastActiveAt: number | undefined,
  nowMs = Date.now(),
): boolean {
  if (lastActiveAt === undefined) {
    return false;
  }

  return nowMs - lastActiveAt >= RECENT_INACTIVITY_THRESHOLD_MS;
}

export async function resolveProtectedEntryRoute(): Promise<'PermissionsSetupScreen' | 'MainTabs'> {
  const permissionSnapshot = await getPermissionSnapshot();
  return permissionSnapshot.allRequiredPermissionsEnabled
    ? 'MainTabs'
    : 'PermissionsSetupScreen';
}

export async function resolveStartupRoute(): Promise<AppEntryRoute> {
  if (!hasCompletedOnboarding()) {
    return 'OnboardingScreen';
  }

  return resolveProtectedEntryRoute();
}
