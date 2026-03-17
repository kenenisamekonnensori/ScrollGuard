import { Linking, Platform } from 'react-native';

/**
 * Opens a specific Android settings intent with app-settings fallback.
 */
export async function openAndroidSettings(action: string, sourceTag: string): Promise<void> {
  if (Platform.OS === 'android' && typeof Linking.sendIntent === 'function') {
    try {
      await Linking.sendIntent(action);
      return;
    } catch {
      try {
        await Linking.openSettings();
        return;
      } catch {
        if (__DEV__) {
          console.warn(`[${sourceTag}] Failed to open Android intent and app settings fallback.`);
        }
        return;
      }
    }
  }

  try {
    await Linking.openSettings();
  } catch {
    if (__DEV__) {
      console.warn(`[${sourceTag}] Failed to open app settings for current platform.`);
    }
  }
}

/**
 * Opens app settings for the current platform.
 */
export async function openAppSettings(sourceTag: string): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    if (__DEV__) {
      console.warn(`[${sourceTag}] Failed to open app settings.`);
    }
  }
}
