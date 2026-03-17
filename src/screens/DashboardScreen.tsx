import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import { refreshMonitoringNow } from '../services/MonitoringService';
import {
  MONITORED_PACKAGE_LIST,
  PACKAGE_ICONS,
  PACKAGE_LABELS,
} from '../utils/appPackages';
import { toMinutes } from '../utils/time';

function formatDuration(seconds: number): string {
  const minutes = toMinutes(seconds);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainderMinutes = minutes % 60;
    return `${hours}h ${remainderMinutes.toString().padStart(2, '0')}m`;
  }

  return `${minutes}m`;
}

export function DashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const lastSyncedAt = useUsageStore(state => state.lastSyncedAt);
  const totalSeconds = Object.values(usageStats).reduce((acc, value) => acc + value, 0);
  const totalVideos = Object.values(videoCounts).reduce((acc, value) => acc + value, 0);
  const hasUsageData = totalSeconds > 0 || totalVideos > 0;
  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Not synced yet';

  return (
    <AppScreen
      title="Your Focus Dashboard"
      subtitle="Live control panel for today’s short-video behavior and lock protection.">
      <SectionCard>
        <Text style={styles.heroLabel}>Time spent today</Text>
        <Text style={styles.heroValue}>{toMinutes(totalSeconds)} min</Text>
        <Text style={styles.heroSub}>Videos watched: {totalVideos}</Text>
        <Text style={styles.heroSub}>Last sync: {lastSyncLabel}</Text>
      </SectionCard>

      <SectionCard title="App usage summary">
        {/* Read app identity from shared constants so package/name changes happen in one place. */}
        {MONITORED_PACKAGE_LIST.map((packageName, index) => {
          const seconds = usageStats[packageName] ?? 0;
          const videos = videoCounts[packageName] ?? 0;
          const isLast = index === MONITORED_PACKAGE_LIST.length - 1;

          return (
            <View key={packageName} style={isLast ? styles.appRowNoBorder : styles.appRow}>
              <View style={styles.appInfo}>
                <View style={styles.appIconWrap}>
                  <Text style={styles.appIcon}>{PACKAGE_ICONS[packageName] ?? '📱'}</Text>
                </View>
                <View>
                  <Text style={styles.appName}>{PACKAGE_LABELS[packageName] ?? packageName}</Text>
                  <Text style={styles.appSub}>Videos: {videos}</Text>
                </View>
              </View>
              <View style={styles.appRight}>
                <Text style={styles.appTime}>Time: {formatDuration(seconds)}</Text>
              </View>
            </View>
          );
        })}
      </SectionCard>

      {!hasUsageData ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>No usage tracked yet. Start scroll detection to see live stats.</Text>
        </View>
      ) : null}

      <SectionCard title="Quick Actions">
        <PrimaryButton label="Sync now" variant="secondary" onPress={() => void refreshMonitoringNow()} />
        <PrimaryButton label="Open Premium to unlock extra time" onPress={() => navigation.navigate('PremiumScreen')} />
        <PrimaryButton label="Preview Lock Overlay" variant="secondary" onPress={() => navigation.navigate('LockScreen')} />
        <PrimaryButton label="Open Profile" variant="ghost" onPress={() => navigation.navigate('ProfileScreen')} />
      </SectionCard>

      <View style={styles.badgeRow}>
        <Text style={styles.badge}>Streak: 4 days</Text>
        <Text style={styles.badge}>Within limit: 78%</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  heroValue: {
    fontSize: 38,
    lineHeight: 44,
    color: colors.primaryDark,
    fontWeight: '800',
  },
  heroSub: {
    color: colors.textMuted,
    fontSize: 13,
  },
  alertBox: {
    borderWidth: 1,
    borderColor: '#B6E9F4',
    backgroundColor: '#EEF9FC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  alertText: {
    color: '#0F3B47',
    fontSize: 13,
    lineHeight: 18,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9F2F4',
  },
  appRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appInfo: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  appIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    fontSize: 15,
  },
  appName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  appSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  appRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  appTime: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
  },
});