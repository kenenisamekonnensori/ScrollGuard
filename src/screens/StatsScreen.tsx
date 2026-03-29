import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { SectionCard } from '../components/ui/SectionCard';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import { MONITORED_PACKAGE_LIST, PACKAGE_ICONS, PACKAGE_LABELS } from '../utils/appPackages';
import { toMinutes } from '../utils/time';

const APP_BAR_COLORS = ['#0EA5E9', '#22C55E', '#F97316'];

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}h ${remainder.toString().padStart(2, '0')}m`;
  }

  return `${minutes}m`;
}

function formatHistoryDateLabel(dateKey: string): string {
  const parsedDate = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(parsedDate);
}

export function StatsScreen(): React.JSX.Element {
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const dailyHistory = useUsageStore(state => state.dailyHistory);

  const dailyMinutes = Object.values(usageStats).reduce((total, value) => total + toMinutes(value), 0);
  const totalVideos = Object.values(videoCounts).reduce((total, value) => total + value, 0);
  const weeklySeconds = dailyHistory.reduce((total, snapshot) => total + snapshot.totalSeconds, 0);
  const weeklyVideos = dailyHistory.reduce((total, snapshot) => total + snapshot.totalVideos, 0);
  const weeklyMinutes = toMinutes(weeklySeconds);
  const sortedHistory = [...dailyHistory].sort((a, b) => b.date.localeCompare(a.date));
  const chartHistory = [...sortedHistory].reverse();
  const chartMaxMinutes = Math.max(
    ...chartHistory.map(snapshot => toMinutes(snapshot.totalSeconds)),
    1,
  );
  const latestSnapshot = sortedHistory[0];
  const previousSnapshot = sortedHistory[1];
  const latestMinutes = latestSnapshot ? toMinutes(latestSnapshot.totalSeconds) : dailyMinutes;
  const previousMinutes = previousSnapshot ? toMinutes(previousSnapshot.totalSeconds) : latestMinutes;
  const trendDeltaMinutes = latestMinutes - previousMinutes;
  const trendDirection = trendDeltaMinutes > 1 ? 'up' : trendDeltaMinutes < -1 ? 'down' : 'flat';
  const trendLabel =
    trendDirection === 'up'
      ? `+${Math.abs(trendDeltaMinutes)} min vs previous day`
      : trendDirection === 'down'
        ? `-${Math.abs(trendDeltaMinutes)} min vs previous day`
        : 'No major change vs previous day';

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
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, styles.timeChip]}>
            <Text style={styles.summaryChipLabel}>Today time</Text>
            <Text style={styles.summaryChipValue}>{formatMinutes(dailyMinutes)}</Text>
          </View>
          <View style={[styles.summaryChip, styles.videoChip]}>
            <Text style={styles.summaryChipLabel}>Videos</Text>
            <Text style={styles.summaryChipValue}>{totalVideos}</Text>
          </View>
        </View>

        <MetricRow label="Time spent today" value={formatMinutes(dailyMinutes)} />
        <MetricRow label="Videos watched" value={`${totalVideos}`} />

        {appRows.map((row, index) => (
          <View key={row.packageName} style={styles.appUsageRow}>
            <View style={styles.appUsageHeader}>
              <View style={styles.appNameWrap}>
                <Text style={styles.appIcon}>{PACKAGE_ICONS[row.packageName] ?? '📱'}</Text>
                <Text style={styles.appName}>{row.appName}</Text>
              </View>
              <Text style={styles.appValue}>Time: {formatMinutes(row.minutes)} • Videos: {row.videos}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: APP_BAR_COLORS[index % APP_BAR_COLORS.length] },
                  {
                    width: `${Math.max((row.minutes / maxMinutes) * 100, row.minutes > 0 ? 8 : 0)}%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Momentum">
        <View
          style={[
            styles.momentumWrap,
            trendDirection === 'down'
              ? styles.momentumGood
              : trendDirection === 'up'
                ? styles.momentumWarn
                : styles.momentumNeutral,
          ]}>
          <Text style={styles.momentumTitle}>
            {trendDirection === 'down'
              ? 'Great trend'
              : trendDirection === 'up'
                ? 'Usage increased'
                : 'Stable pace'}
          </Text>
          <Text style={styles.momentumValue}>{trendLabel}</Text>
          <Text style={styles.momentumHint}>Based on your latest local daily snapshots.</Text>
        </View>
      </SectionCard>

      <SectionCard title="Weekly usage">
        <MetricRow label="Last 7 days time" value={formatMinutes(weeklyMinutes)} />
        <MetricRow label="Last 7 days videos" value={`${weeklyVideos}`} />
        {chartHistory.length > 0 ? (
          <View style={styles.weekChartWrap}>
            {chartHistory.map((snapshot, index) => {
              const minutes = toMinutes(snapshot.totalSeconds);
              const barHeight = Math.max((minutes / chartMaxMinutes) * 100, minutes > 0 ? 12 : 0);

              return (
                <View key={`${snapshot.date}-chart`} style={styles.weekChartCol}>
                  <View style={styles.weekChartTrack}>
                    <View
                      style={[
                        styles.weekChartFill,
                        {
                          height: `${barHeight}%`,
                          backgroundColor: APP_BAR_COLORS[index % APP_BAR_COLORS.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.weekChartLabel}>{formatHistoryDateLabel(snapshot.date).split(',')[0]}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
        <Text style={styles.helperText}>
          Weekly values come from local daily snapshots stored on device.
        </Text>
        {sortedHistory.length === 0 ? (
          <Text style={styles.helperText}>No local history yet. Keep using ScrollGuard to build your timeline.</Text>
        ) : null}
        <Text style={styles.helperText}>
          Cloud sync for cross-device history is coming soon.
        </Text>
      </SectionCard>

      <SectionCard title="Last 7 Days (Local)">
        {sortedHistory.length > 0 ? (
          sortedHistory.map((snapshot, index) => (
            <View key={snapshot.date} style={index === sortedHistory.length - 1 ? styles.historyRowLast : styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>{formatHistoryDateLabel(snapshot.date)}</Text>
                <Text style={styles.historySub}>{snapshot.totalVideos} videos</Text>
              </View>
              <Text style={styles.historyTime}>{formatMinutes(toMinutes(snapshot.totalSeconds))}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.helperText}>Daily entries will appear here after your first tracked sessions.</Text>
        )}
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
    paddingVertical: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  timeChip: {
    backgroundColor: '#ECFEFF',
    borderColor: '#99F6E4',
  },
  videoChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  summaryChipLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryChipValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  appUsageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appIcon: {
    fontSize: 14,
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
    borderRadius: 999,
  },
  momentumWrap: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  momentumGood: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },
  momentumWarn: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  momentumNeutral: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  momentumTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  momentumValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  momentumHint: {
    color: '#64748B',
    fontSize: 12,
  },
  weekChartWrap: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 108,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#D8E6EE',
    backgroundColor: '#F8FCFF',
  },
  weekChartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  weekChartTrack: {
    width: 12,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekChartFill: {
    width: '100%',
    borderRadius: 999,
  },
  weekChartLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  historyRow: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRowLast: {
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyDate: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  historySub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  historyTime: {
    color: '#0C4A6E',
    fontSize: 13,
    fontWeight: '800',
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});