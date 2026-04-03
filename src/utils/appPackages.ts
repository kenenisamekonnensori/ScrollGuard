export const MONITORED_PACKAGES = {
  tiktok: 'com.zhiliaoapp.musically',
  instagram: 'com.instagram.android',
  youtube: 'com.google.android.youtube',
} as const;

export const MONITORED_PACKAGE_GROUPS = {
  tiktok: [
    MONITORED_PACKAGES.tiktok,
    'com.zhiliaoapp.musically.go',
  ],
  instagram: [
    MONITORED_PACKAGES.instagram,
    'com.instagram.lite',
  ],
  youtube: [
    MONITORED_PACKAGES.youtube,
  ],
} as const;

export type MonitoredAppFamily = keyof typeof MONITORED_PACKAGE_GROUPS;

export const MONITORED_PACKAGE_LIST = Array.from(
  new Set(Object.values(MONITORED_PACKAGE_GROUPS).flat()),
);

export const PACKAGE_LABELS: Record<string, string> = {
  [MONITORED_PACKAGES.tiktok]: 'TikTok',
  'com.zhiliaoapp.musically.go': 'TikTok Lite',
  [MONITORED_PACKAGES.instagram]: 'Instagram',
  'com.instagram.lite': 'Instagram Lite',
  [MONITORED_PACKAGES.youtube]: 'YouTube',
};

/**
 * UI icon metadata for monitored apps.
 */
export const PACKAGE_ICONS: Record<string, string> = {
  [MONITORED_PACKAGES.tiktok]: '▶️',
  'com.zhiliaoapp.musically.go': '▶️',
  [MONITORED_PACKAGES.instagram]: '📷',
  'com.instagram.lite': '📷',
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
  'com.zhiliaoapp.musically.go': 'tiktokLimitMinutes',
  [MONITORED_PACKAGES.instagram]: 'instagramLimitMinutes',
  'com.instagram.lite': 'instagramLimitMinutes',
  [MONITORED_PACKAGES.youtube]: 'youtubeLimitMinutes',
};

export const FAMILY_LIMIT_KEYS: Record<MonitoredAppFamily, LimitSettingKey> = {
  tiktok: 'tiktokLimitMinutes',
  instagram: 'instagramLimitMinutes',
  youtube: 'youtubeLimitMinutes',
};
