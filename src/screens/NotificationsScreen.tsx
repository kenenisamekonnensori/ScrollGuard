import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { SectionCard } from '../components/ui/SectionCard';
import {
  getResolvedAppLocks,
  ResolvedAppLock,
} from '../features/blocking/blockingController';
import {
  getDeliveredNotificationHistory,
  NotificationHistoryItem,
} from '../services/NotificationService';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';

function getAlertIcon(severity: NotificationHistoryItem['severity']): string {
  if (severity === 'danger') {
    return '🔒';
  }

  if (severity === 'warning') {
    return '⚠️';
  }

  return 'ℹ️';
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function NotificationsScreen(): React.JSX.Element {
  const lastSyncedAt = useUsageStore(state => state.lastSyncedAt);
  const [activeLocks, setActiveLocks] = React.useState<ResolvedAppLock[]>([]);
  const [history, setHistory] = React.useState<NotificationHistoryItem[]>([]);

  const refreshScreenData = React.useCallback(async (): Promise<void> => {
    try {
      const [resolvedLocks] = await Promise.all([getResolvedAppLocks()]);
      setActiveLocks(resolvedLocks);
      setHistory(getDeliveredNotificationHistory());
    } catch (error) {
      if (__DEV__) {
        console.warn('[NotificationsScreen] Failed to refresh notification data.', error);
      }
      setActiveLocks([]);
      setHistory(getDeliveredNotificationHistory());
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshScreenData().catch(error => {
        if (__DEV__) {
          console.warn('[NotificationsScreen] Failed to refresh on focus.', error);
        }
      });
    }, [refreshScreenData]),
  );

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
      subtitle="Real alerts sent to the device, plus current live lock status.">
      <SectionCard title="Live Protection">
        {activeLocks.length > 0 ? (
          activeLocks.map(lock => (
            <View key={lock.packageName} style={styles.alertItem}>
              <Text style={styles.item}>
                🔒 {lock.appName} is currently blocked
                {lock.lockedUntil
                  ? ` until ${new Date(lock.lockedUntil).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}.`
                  : '.'}
              </Text>
              <Text style={styles.time}>Updated {syncLabel}</Text>
            </View>
          ))
        ) : (
          <View style={styles.alertItem}>
            <Text style={styles.item}>✅ No active blocks right now.</Text>
            <Text style={styles.time}>Updated {syncLabel}</Text>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Delivered Alerts">
        {history.length > 0 ? (
          history.map(item => (
            <View key={item.id} style={styles.alertItem}>
              <Text style={styles.item}>{getAlertIcon(item.severity)} {item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>Sent {formatTimestamp(item.createdAt)}</Text>
            </View>
          ))
        ) : (
          <View style={styles.alertItem}>
            <Text style={styles.item}>ℹ️ No notifications have been sent yet.</Text>
            <Text style={styles.time}>ScrollGuard will log real warnings and lock events here.</Text>
          </View>
        )}
      </SectionCard>

      <SectionCard title="Summary">
        <MetricRow label="Last sync" value={syncLabel} />
        <MetricRow label="Delivered alerts" value={`${history.length}`} />
        <MetricRow label="Active blocks" value={`${activeLocks.length}`} />
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  alertItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2F4',
    gap: 3,
  },
  item: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  body: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  time: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});
