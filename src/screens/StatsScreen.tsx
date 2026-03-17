import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { SectionCard } from '../components/ui/SectionCard';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import { MONITORED_PACKAGE_LIST, PACKAGE_LABELS } from '../utils/appPackages';
import { toMinutes } from '../utils/time';

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}h ${remainder.toString().padStart(2, '0')}m`;
  }

  return `${minutes}m`;
}

export function StatsScreen(): React.JSX.Element {
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);

  const dailyMinutes = Object.values(usageStats).reduce((total, value) => total + toMinutes(value), 0);
  const totalVideos = Object.values(videoCounts).reduce((total, value) => total + value, 0);
  const weeklyMinutesEstimate = dailyMinutes * 7;
  const weeklyVideosEstimate = totalVideos * 7;

  // Build rows from shared constants so monitored package changes propagate consistently.
  const appRows = MONITORED_PACKAGE_LIST.map(packageName => {
    const minutes = toMinutes(usageStats[packageName] ?? 0);
    const videos = videoCounts[packageName] ?? 0;
    return {
      packageName,
      appName: PACKAGE_LABELS[packageName] ?? packageName,
      minutes,
      videos,
    };
  });

  const maxMinutes = Math.max(...appRows.map(row => row.minutes), 1);

  return (
    <AppScreen
      title="Usage Analytics"
      subtitle="Daily and weekly summaries of your short-video behavior.">
      <SectionCard title="Daily usage">
        <MetricRow label="Time spent today" value={formatMinutes(dailyMinutes)} />
        <MetricRow label="Videos watched" value={`${totalVideos}`} />

        {appRows.map(row => (
          <View key={row.packageName} style={styles.appUsageRow}>
            <View style={styles.appUsageHeader}>
              <Text style={styles.appName}>{row.appName}</Text>
              <Text style={styles.appValue}>Time: {formatMinutes(row.minutes)} • Videos: {row.videos}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max((row.minutes / maxMinutes) * 100, row.minutes > 0 ? 8 : 0)}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Weekly usage">
        <MetricRow label="Estimated weekly time" value={formatMinutes(weeklyMinutesEstimate)} />
        <MetricRow label="Estimated weekly videos" value={`${weeklyVideosEstimate}`} />
        <Text style={styles.helperText}>Weekly values are estimated from current daily totals.</Text>
      </SectionCard>

      <SectionCard title="Videos watched">
        {appRows.map(row => (
          <MetricRow key={`videos-${row.packageName}`} label={row.appName} value={`${row.videos}`} />
        ))}
        <MetricRow label="Total videos today" value={`${totalVideos}`} />
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  appUsageRow: {
    gap: 6,
  },
  appUsageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  appValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#E5ECF5',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});