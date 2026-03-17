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
