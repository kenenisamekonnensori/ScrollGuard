import { create } from 'zustand';
import { UserSettings } from '../db/models';
import { getValue, setValue } from '../db/storage';

const SETTINGS_STORAGE_KEY = 'userSettings';

/**
 * Default user settings used when no persisted settings exist yet.
 */
const DEFAULT_USER_SETTINGS: UserSettings = {
  tiktokLimitMinutes: 20,
  instagramLimitMinutes: 15,
  youtubeLimitMinutes: 15,
  lockDurationMinutes: 30,
};

/**
 * Limits that can be updated individually from settings screens/forms.
 */
type SettingsLimitKey =
  | 'tiktokLimitMinutes'
  | 'instagramLimitMinutes'
  | 'youtubeLimitMinutes'
  | 'lockDurationMinutes';

/**
 * Shape of the settings store state and actions.
 */
interface SettingsState {
  userSettings: UserSettings;
  setUserSettings: (settings: UserSettings) => void;
  updateLimit: (key: SettingsLimitKey, value: number) => void;
}

/**
 * Reads persisted user settings from MMKV and falls back to defaults.
 */
function getInitialUserSettings(): UserSettings {
  return getValue<UserSettings>(SETTINGS_STORAGE_KEY) ?? DEFAULT_USER_SETTINGS;
}

/**
 * Global settings store for limits and lock duration.
 * Initializes from MMKV and persists every update back to MMKV.
 */
export const useSettingsStore = create<SettingsState>(set => ({
  userSettings: getInitialUserSettings(),

  /**
   * Replaces all user settings and persists them.
   */
  setUserSettings: settings => {
    setValue(SETTINGS_STORAGE_KEY, settings);
    set({ userSettings: settings });
  },

  /**
   * Updates one settings field and persists the merged result.
   */
  updateLimit: (key, value) => {
    set(state => {
      const nextSettings: UserSettings = {
        ...state.userSettings,
        [key]: value,
      };

      setValue(SETTINGS_STORAGE_KEY, nextSettings);
      return { userSettings: nextSettings };
    });
  },
}));
