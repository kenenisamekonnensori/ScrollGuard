import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { useSettingsStore } from '../store/settingsStore';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import { refreshMonitoringNow } from '../services/MonitoringService';
import {
  LIMIT_SETTING_KEYS,
  MONITORED_PACKAGE_LIST,
  PACKAGE_ICONS,
  PACKAGE_LABELS,
} from '../utils/appPackages';
import { toMinutes } from '../utils/time';

const APP_BAR_COLORS = ['#0EA5E9', '#22C55E', '#F97316'];

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
  const userSettings = useSettingsStore(state => state.userSettings);
  const totalSeconds = Object.values(usageStats).reduce((acc, value) => acc + value, 0);
  const totalVideos = Object.values(videoCounts).reduce((acc, value) => acc + value, 0);
  const hasUsageData = totalSeconds > 0 || totalVideos > 0;
  const appsWithinLimit = MONITORED_PACKAGE_LIST.filter(packageName => {
    const seconds = usageStats[packageName] ?? 0;
    const minutes = seconds / 60;
    const limitKey = LIMIT_SETTING_KEYS[packageName];
    return minutes <= userSettings[limitKey];
  }).length;
  const withinLimitPercentage = Math.round((appsWithinLimit / MONITORED_PACKAGE_LIST.length) * 100);
  const maxUsageMinutes = Math.max(
    ...MONITORED_PACKAGE_LIST.map(packageName => toMinutes(usageStats[packageName] ?? 0)),
    1,
  );
  const focusStatus =
    withinLimitPercentage >= 100
      ? 'Perfect control today'
      : withinLimitPercentage >= 67
        ? 'Strong control with room to improve'
        : 'Usage is above limits for multiple apps';
  const focusMeterWidth = `${Math.max(withinLimitPercentage, 4)}%`;
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
        <View style={styles.heroChips}>
          <View style={[styles.heroChip, styles.timeChip]}>
            <Text style={styles.heroChipLabel}>Today time</Text>
            <Text style={styles.heroChipValue}>{toMinutes(totalSeconds)} min</Text>
          </View>
          <View style={[styles.heroChip, styles.videoChip]}>
            <Text style={styles.heroChipLabel}>Videos</Text>
            <Text style={styles.heroChipValue}>{totalVideos}</Text>
          </View>
        </View>

        <Text style={styles.heroLabel}>Time spent today</Text>
        <Text style={styles.heroValue}>{toMinutes(totalSeconds)} min</Text>
        <Text style={styles.heroSub}>Videos watched: {totalVideos}</Text>
        <Text style={styles.heroSub}>Last sync: {lastSyncLabel}</Text>
      </SectionCard>

      <SectionCard title="Focus status">
        <View
          style={[
            styles.focusStatusBox,
            withinLimitPercentage >= 100
              ? styles.focusStatusGreat
              : withinLimitPercentage >= 67
                ? styles.focusStatusGood
                : styles.focusStatusNeedsAttention,
          ]}>
          <Text style={styles.focusStatusTitle}>Within limits: {withinLimitPercentage}%</Text>
          <Text style={styles.focusStatusMeta}>Apps in range: {appsWithinLimit}/{MONITORED_PACKAGE_LIST.length}</Text>
          <View style={styles.focusMeterTrack}>
            <View style={[styles.focusMeterFill, { width: focusMeterWidth }]} />
          </View>
          <Text style={styles.focusStatusText}>{focusStatus}</Text>
          <Text style={styles.focusStatusHint}>Based on local usage and your configured daily limits.</Text>
        </View>
      </SectionCard>

      <SectionCard title="App usage summary">
        {/* Read app identity from shared constants so package/name changes happen in one place. */}
        {MONITORED_PACKAGE_LIST.map((packageName, index) => {
          const seconds = usageStats[packageName] ?? 0;
          const videos = videoCounts[packageName] ?? 0;
          const minutes = toMinutes(seconds);
          const isLast = index === MONITORED_PACKAGE_LIST.length - 1;

          return (
            <View key={packageName} style={isLast ? styles.appRowNoBorder : styles.appRow}>
              <View style={styles.appTopRow}>
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

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: APP_BAR_COLORS[index % APP_BAR_COLORS.length],
                      width: `${Math.max((minutes / maxUsageMinutes) * 100, minutes > 0 ? 8 : 0)}%`,
                    },
                  ]}
                />
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
        <Text style={styles.badgeMuted}>Streak: Coming soon</Text>
        <Text style={styles.badgeStrong}>Within limit: {withinLimitPercentage}%</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroChips: {
    flexDirection: 'row',
    gap: 10,
  },
  heroChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  timeChip: {
    backgroundColor: '#ECFEFF',
    borderColor: '#99F6E4',
  },
  videoChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  heroChipLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  heroChipValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
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
  focusStatusBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  focusStatusGreat: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },
  focusStatusGood: {
    backgroundColor: '#F0F9FF',
    borderColor: '#7DD3FC',
  },
  focusStatusNeedsAttention: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  focusStatusTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  focusStatusMeta: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  focusMeterTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#DDE7EE',
    overflow: 'hidden',
    marginTop: 2,
  },
  focusMeterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0EA5E9',
  },
  focusStatusText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  focusStatusHint: {
    color: '#64748B',
    fontSize: 12,
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
    gap: 7,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9F2F4',
  },
  appRowNoBorder: {
    gap: 7,
  },
  appTopRow: {
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
  progressTrack: {
    height: 9,
    backgroundColor: '#E5ECF5',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeMuted: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeStrong: {
    backgroundColor: '#DBF4FB',
    color: '#0C4A6E',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '800',
  },
});