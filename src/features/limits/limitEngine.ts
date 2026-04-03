import { blockApp } from '../blocking/blockingController';
import { useSettingsStore } from '../../store/settingsStore';
import { useUsageStore } from '../../store/usageStore';
import { sendLimitReachedNotification } from '../../services/NotificationService';
import {
  FAMILY_LIMIT_KEYS,
  MONITORED_PACKAGE_GROUPS,
  PACKAGE_LABELS,
  MonitoredAppFamily,
} from '../../utils/appPackages';

type MonitoredAppConfig = {
  family: MonitoredAppFamily;
  packageNames: readonly string[];
  appName: string;
  settingKey: (typeof FAMILY_LIMIT_KEYS)[MonitoredAppFamily];
};

const MONITORED_APPS: MonitoredAppConfig[] = [
  {
    family: 'tiktok',
    packageNames: MONITORED_PACKAGE_GROUPS.tiktok,
    appName: PACKAGE_LABELS[MONITORED_PACKAGE_GROUPS.tiktok[0]],
    settingKey: FAMILY_LIMIT_KEYS.tiktok,
  },
  {
    family: 'instagram',
    packageNames: MONITORED_PACKAGE_GROUPS.instagram,
    appName: PACKAGE_LABELS[MONITORED_PACKAGE_GROUPS.instagram[0]],
    settingKey: FAMILY_LIMIT_KEYS.instagram,
  },
  {
    family: 'youtube',
    packageNames: MONITORED_PACKAGE_GROUPS.youtube,
    appName: PACKAGE_LABELS[MONITORED_PACKAGE_GROUPS.youtube[0]],
    settingKey: FAMILY_LIMIT_KEYS.youtube,
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
    const usageSeconds = app.packageNames.reduce((total, packageName) => {
      return total + (usageStats[packageName] ?? 0);
    }, 0);
    const usageMinutes = usageSeconds / 60;
    const limitMinutes = userSettings[app.settingKey];

    if (usageMinutes > limitMinutes) {
      for (const packageName of app.packageNames) {
        await blockApp(packageName);
      }
      sendLimitReachedNotification(app.appName);
    }
  }
}
