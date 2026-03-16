import { blockApp } from '../../native/NativeBridgeService';
import { useSettingsStore } from '../../store/settingsStore';
import { useUsageStore } from '../../store/usageStore';
import { sendLimitReachedNotification } from '../../services/NotificationService';

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
    packageName: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    settingKey: 'tiktokLimitMinutes',
  },
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    settingKey: 'instagramLimitMinutes',
  },
  {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
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
