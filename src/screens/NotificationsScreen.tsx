import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { SectionCard } from '../components/ui/SectionCard';
import { getLockState } from '../features/blocking/blockingController';
import { useSettingsStore } from '../store/settingsStore';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import {
  LIMIT_SETTING_KEYS,
  MONITORED_PACKAGE_LIST,
  PACKAGE_LABELS,
} from '../utils/appPackages';
import { toMinutes } from '../utils/time';

type AlertItem = {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
};

function getAlertIcon(severity: AlertItem['severity']): string {
  if (severity === 'danger') {
    return '🔒';
  }

  if (severity === 'warning') {
    return '⚠️';
  }

  return 'ℹ️';
}

export function NotificationsScreen(): React.JSX.Element {
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const lastSyncedAt = useUsageStore(state => state.lastSyncedAt);
  const userSettings = useSettingsStore(state => state.userSettings);

  const alerts: AlertItem[] = [];

  MONITORED_PACKAGE_LIST.forEach(packageName => {
    const appName = PACKAGE_LABELS[packageName] ?? packageName;
    const usageMinutes = toMinutes(usageStats[packageName] ?? 0);
    const limitMinutes = userSettings[LIMIT_SETTING_KEYS[packageName]];
    const usagePercent = limitMinutes > 0 ? (usageMinutes / limitMinutes) * 100 : 0;
    const lockState = getLockState(packageName);

    if (lockState) {
      alerts.push({
        id: `${packageName}-locked`,
        message: `${appName} is currently blocked until ${new Date(lockState.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        severity: 'danger',
      });
      return;
    }

    if (usagePercent >= 100) {
      alerts.push({
        id: `${packageName}-limit`,
        message: `${appName} reached its daily limit (${usageMinutes}/${limitMinutes} min).`,
        severity: 'danger',
      });
      return;
    }

    if (usagePercent >= 75) {
      alerts.push({
        id: `${packageName}-warn75`,
        message: `${appName} is at ${Math.floor(usagePercent)}% of daily limit (${usageMinutes}/${limitMinutes} min).`,
        severity: 'warning',
      });
      return;
    }

    if (usagePercent >= 50) {
      alerts.push({
        id: `${packageName}-warn50`,
        message: `${appName} crossed 50% of daily limit (${usageMinutes}/${limitMinutes} min).`,
        severity: 'warning',
      });
    }
  });

  const totalVideos = Object.values(videoCounts).reduce((total, value) => total + value, 0);
  const summaryAlert: AlertItem = {
    id: 'videos-summary',
    message: `Videos watched today: ${totalVideos}`,
    severity: 'info',
  };

  const syncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Not synced yet';

  return (
    <AppScreen
      title="Notifications Center"
      subtitle="Review warnings, lock events, streak wins, and motivation nudges.">
      <SectionCard title="Live Alerts">
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <View key={alert.id} style={styles.alertItem}>
              <Text style={styles.item}>{getAlertIcon(alert.severity)} {alert.message}</Text>
              <Text style={styles.time}>Updated {syncLabel}</Text>
            </View>
          ))
        ) : (
          <View style={styles.alertItem}>
            <Text style={styles.item}>✅ No active warnings right now.</Text>
            <Text style={styles.time}>Updated {syncLabel}</Text>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Summary">
        <MetricRow label="Last sync" value={syncLabel} />
        <View style={styles.alertItem}>
          <Text style={styles.item}>{getAlertIcon(summaryAlert.severity)} {summaryAlert.message}</Text>
          <Text style={styles.time}>Updated {syncLabel}</Text>
        </View>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  alertItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2F4',
    gap: 3,
  },
  item: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  time: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});