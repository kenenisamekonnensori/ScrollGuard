export const MONITORED_PACKAGES = {
  tiktok: 'com.zhiliaoapp.musically',
  instagram: 'com.instagram.android',
  youtube: 'com.google.android.youtube',
} as const;

export const MONITORED_PACKAGE_LIST = Object.values(MONITORED_PACKAGES);

export const PACKAGE_LABELS: Record<string, string> = {
  [MONITORED_PACKAGES.tiktok]: 'TikTok',
  [MONITORED_PACKAGES.instagram]: 'Instagram',
  [MONITORED_PACKAGES.youtube]: 'YouTube',
};

/**
 * UI icon metadata for monitored apps.
 */
export const PACKAGE_ICONS: Record<string, string> = {
  [MONITORED_PACKAGES.tiktok]: '▶️',
  [MONITORED_PACKAGES.instagram]: '📷',
  [MONITORED_PACKAGES.youtube]: '📺',
};

export type LimitSettingKey =
  | 'tiktokLimitMinutes'
  | 'instagramLimitMinutes'
  | 'youtubeLimitMinutes';

/**
 * Canonical mapping from monitored package to its corresponding daily-limit setting key.
 */
export const LIMIT_SETTING_KEYS: Record<string, LimitSettingKey> = {
  [MONITORED_PACKAGES.tiktok]: 'tiktokLimitMinutes',
  [MONITORED_PACKAGES.instagram]: 'instagramLimitMinutes',
  [MONITORED_PACKAGES.youtube]: 'youtubeLimitMinutes',
};
