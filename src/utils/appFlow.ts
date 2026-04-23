import { getPermissionSnapshot } from '../native/NativeBridgeService';
import { getValue, setValue } from '../db/storage';

const ONBOARDING_COMPLETED_STORAGE_KEY = 'appFlow.onboardingCompleted';

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
