import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { refreshMonitoringNow } from '../services/MonitoringService';
import { useSettingsStore } from '../store/settingsStore';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import {
  LIMIT_SETTING_KEYS,
  MONITORED_PACKAGE_LIST,
  PACKAGE_ICONS,
  PACKAGE_LABELS,
} from '../utils/appPackages';
import { toMinutes } from '../utils/time';

const APP_BAR_COLORS = ['#21C8E6', '#5E8DF7', '#7B8797'];

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}h ${remainder}m`;
  }

  return `${minutes}m`;
}

export function DashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const userSettings = useSettingsStore(state => state.userSettings);
  const lastSyncedAt = useUsageStore(state => state.lastSyncedAt);

  const totalSeconds = Object.values(usageStats).reduce((acc, value) => acc + value, 0);
  const totalMinutes = toMinutes(totalSeconds);
  const totalVideos = Object.values(videoCounts).reduce((acc, value) => acc + value, 0);
  const totalLimit = MONITORED_PACKAGE_LIST.reduce((acc, packageName) => {
    return acc + userSettings[LIMIT_SETTING_KEYS[packageName]];
  }, 0);
  const remainingMinutes = Math.max(totalLimit - totalMinutes, 0);
  const limitUsedPercent = totalLimit > 0 ? Math.min(Math.round((totalMinutes / totalLimit) * 100), 100) : 0;
  const ringBorderColor =
    limitUsedPercent >= 100 ? '#F59E0B' : limitUsedPercent >= 75 ? '#21C8E6' : '#9EDFF0';
  const appRows = MONITORED_PACKAGE_LIST.map(packageName => ({
    packageName,
    appName: PACKAGE_LABELS[packageName] ?? packageName,
    icon: PACKAGE_ICONS[packageName] ?? '📱',
    minutes: toMinutes(usageStats[packageName] ?? 0),
    videos: videoCounts[packageName] ?? 0,
    limitMinutes: userSettings[LIMIT_SETTING_KEYS[packageName]],
  }));
  const maxMinutes = Math.max(...appRows.map(row => row.minutes), 1);
  const message =
    limitUsedPercent >= 100
      ? 'You hit your daily focus ceiling. Step away before the next lock starts stacking.'
      : limitUsedPercent >= 75
        ? 'You have watched a lot today. Consider taking a break before you hit your limit.'
        : 'Usage is under control. Keep the streak clean while you still have room left.';
  const lastSyncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not synced yet';

  return (
    <AppScreen
      title="ScrollGuard"
      subtitle="Your live dashboard for daily focus and app protection.">
      <SectionCard>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>Daily Focus</Text>
          <View style={styles.limitBadge}>
            <Text style={styles.limitBadgeText}>{limitUsedPercent}% Limit Used</Text>
          </View>
        </View>

        <View style={styles.heroContent}>
          <View style={[styles.ringWrap, { borderColor: ringBorderColor }]}>
            <Text style={styles.ringValue}>{formatMinutes(totalMinutes)}</Text>
            <Text style={styles.ringLabel}>SCROLLING</Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatRow}>
              <Text style={styles.heroStatDot}>◉</Text>
              <Text style={styles.heroStatText}>{totalVideos} videos watched</Text>
            </View>
            <View style={styles.heroStatRow}>
              <Text style={styles.heroStatDot}>◉</Text>
              <Text style={styles.heroStatText}>{remainingMinutes}m remaining</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${Math.max(limitUsedPercent, 6)}%` }]} />
            </View>
            <Text style={styles.heroMeta}>Last sync: {lastSyncLabel}</Text>
          </View>
        </View>
      </SectionCard>

      <View style={styles.callout}>
        <Text style={styles.calloutIcon}>i</Text>
        <Text style={styles.calloutText}>{message}</Text>
      </View>

      <View style={styles.actionRow}>
        <View style={styles.actionButtonWrap}>
          <PrimaryButton label="Focus Mode" onPress={() => navigation.navigate('FocusModeScreen')} />
        </View>
        <View style={styles.actionButtonWrap}>
          <PrimaryButton
            label="Adjust Limits"
            variant="secondary"
            onPress={() => navigation.navigate('SettingsScreen')}
          />
        </View>
      </View>

      <SectionCard title="App Usage Breakdown">
        {appRows.map((row, index) => (
          <View key={row.packageName} style={styles.appRow}>
            <View style={styles.appLeft}>
              <View style={styles.appIconWrap}>
                <Text style={styles.appIcon}>{row.icon}</Text>
              </View>
              <View>
                <Text style={styles.appName}>{row.appName}</Text>
                <Text style={styles.appSub}>{row.videos} videos watched</Text>
              </View>
            </View>
            <View style={styles.appRight}>
              <Text style={styles.appTime}>{formatMinutes(row.minutes)}</Text>
              <View style={styles.microBars}>
                {[0, 1, 2].map(step => (
                  <View
                    key={`${row.packageName}-${step}`}
                    style={[
                      styles.microBar,
                      {
                        opacity: (row.minutes / maxMinutes) * 3 > step ? 1 : 0.2,
                        backgroundColor: APP_BAR_COLORS[index % APP_BAR_COLORS.length],
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>
        ))}
      </SectionCard>

      <PrimaryButton
        label="Refresh Dashboard"
        variant="ghost"
        onPress={() => {
          refreshMonitoringNow().catch(error => {
            if (__DEV__) {
              console.warn('[DashboardScreen] Failed to sync monitoring data.', error);
            }
          });
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroTitle: {
    color: '#0B1330',
    fontSize: 24,
    fontWeight: '800',
  },
  limitBadge: {
    borderRadius: 999,
    backgroundColor: '#EAFBFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  limitBadgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  ringWrap: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    color: '#0B1330',
    fontSize: 30,
    fontWeight: '900',
  },
  ringLabel: {
    color: '#7A8CA4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  heroStats: {
    flex: 1,
    gap: 10,
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatDot: {
    color: colors.primary,
    fontSize: 10,
  },
  heroStatText: {
    color: '#24324A',
    fontSize: 14,
    fontWeight: '600',
  },
  meterTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E7EDF2',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  heroMeta: {
    color: '#7A8CA4',
    fontSize: 12,
    fontWeight: '600',
  },
  callout: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CCEEF4',
    backgroundColor: '#F0FBFD',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  calloutIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 24,
    color: colors.primaryDark,
    backgroundColor: '#D8F5FB',
    fontWeight: '800',
  },
  calloutText: {
    flex: 1,
    color: '#2E3D53',
    fontSize: 15,
    lineHeight: 23,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonWrap: {
    flex: 1,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF3F6',
  },
  appLeft: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  appIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F7FBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    fontSize: 18,
  },
  appName: {
    color: '#0B1330',
    fontSize: 16,
    fontWeight: '800',
  },
  appSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  appRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  appTime: {
    color: colors.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  microBars: {
    flexDirection: 'row',
    gap: 3,
  },
  microBar: {
    width: 4,
    height: 16,
    borderRadius: 999,
  },
});
