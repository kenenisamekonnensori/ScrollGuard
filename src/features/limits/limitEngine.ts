import { blockApp } from '../blocking/blockingController';
import { useSettingsStore } from '../../store/settingsStore';
import { useUsageStore } from '../../store/usageStore';
import { sendLimitReachedNotification } from '../../services/NotificationService';
import { MONITORED_PACKAGES, PACKAGE_LABELS } from '../../utils/appPackages';

type MonitoredAppConfig = {
  packageName: string;
  appName: string;
  settingKey:
    | 'tiktokLimitMinutes'
    | 'instagramLimitMinutes'
    | 'youtubeLimitMinutes';
};

const MONITORED_APPS: MonitoredAppConfig[] = [
  {
    packageName: MONITORED_PACKAGES.tiktok,
    appName: PACKAGE_LABELS[MONITORED_PACKAGES.tiktok],
    settingKey: 'tiktokLimitMinutes',
  },
  {
    packageName: MONITORED_PACKAGES.instagram,
    appName: PACKAGE_LABELS[MONITORED_PACKAGES.instagram],
    settingKey: 'instagramLimitMinutes',
  },
  {
    packageName: MONITORED_PACKAGES.youtube,
    appName: PACKAGE_LABELS[MONITORED_PACKAGES.youtube],
    settingKey: 'youtubeLimitMinutes',
  },
];

/**
 * Compares usage data against user-configured limits and triggers app blocking
 * for any monitored app that exceeds its limit.
 */
export async function evaluateUsageLimits(): Promise<void> {
  const { usageStats } = useUsageStore.getState();
  const { userSettings } = useSettingsStore.getState();

  for (const app of MONITORED_APPS) {
    const usageSeconds = usageStats[app.packageName] ?? 0;
    const usageMinutes = usageSeconds / 60;
    const limitMinutes = userSettings[app.settingKey];

    if (usageMinutes > limitMinutes) {
      await blockApp(app.packageName);
      sendLimitReachedNotification(app.appName);
    }
  }
}
