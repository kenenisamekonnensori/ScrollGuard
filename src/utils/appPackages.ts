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

// Canonical app list used by UI/settings/focus metrics (no duplicate Lite rows).
export const MONITORED_PACKAGE_LIST = Object.values(MONITORED_PACKAGES);

// Alias-inclusive package list used for detection and native event matching.
export const MONITORED_PACKAGE_ALIAS_LIST = Array.from(
  new Set(Object.values(MONITORED_PACKAGE_GROUPS).flat()),
);

export const PACKAGE_LABELS: Record<string, string> = {
  [MONITORED_PACKAGES.tiktok]: 'TikTok',
  [MONITORED_PACKAGES.instagram]: 'Instagram',
  [MONITORED_PACKAGES.youtube]: 'YouTube',
};

/**
 * UI icon metadata for canonical monitored apps.
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

export const PACKAGE_TO_CANONICAL: Record<string, string> = {
  [MONITORED_PACKAGES.tiktok]: MONITORED_PACKAGES.tiktok,
  'com.zhiliaoapp.musically.go': MONITORED_PACKAGES.tiktok,
  [MONITORED_PACKAGES.instagram]: MONITORED_PACKAGES.instagram,
  'com.instagram.lite': MONITORED_PACKAGES.instagram,
  [MONITORED_PACKAGES.youtube]: MONITORED_PACKAGES.youtube,
};

export function resolveCanonicalPackageName(packageName: string): string {
  return PACKAGE_TO_CANONICAL[packageName] ?? packageName;
}

export const FAMILY_LIMIT_KEYS: Record<MonitoredAppFamily, LimitSettingKey> = {
  tiktok: 'tiktokLimitMinutes',
  instagram: 'instagramLimitMinutes',
  youtube: 'youtubeLimitMinutes',
};
