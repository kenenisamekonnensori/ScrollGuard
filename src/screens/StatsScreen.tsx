import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { SectionCard } from '../components/ui/SectionCard';
import { getBlockHistory } from '../features/blocking/blockingController';
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

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isWithinCurrentWeek(timestamp: number): boolean {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  return timestamp >= startOfWeek.getTime();
}

function buildLastSevenDaysHistory(
  dailyHistory: ReturnType<typeof useUsageStore.getState>['dailyHistory'],
): Array<{ date: string; minutes: number; dayLabel: string }> {
  const historyByDate = new Map(
    dailyHistory.map(snapshot => [snapshot.date, toMinutes(snapshot.totalSeconds)]),
  );
  const days: Array<{ date: string; minutes: number; dayLabel: string }> = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const dateKey = getLocalDateKey(date);

    days.push({
      date: dateKey,
      minutes: historyByDate.get(dateKey) ?? 0,
      dayLabel: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
    });
  }

  return days;
}

export function StatsScreen(): React.JSX.Element {
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const dailyHistory = useUsageStore(state => state.dailyHistory);
  const blockHistory = getBlockHistory();

  const dailyMinutes = Object.values(usageStats).reduce((total, value) => total + toMinutes(value), 0);
  const totalVideos = Object.values(videoCounts).reduce((total, value) => total + value, 0);
  const fullWeekHistory = buildLastSevenDaysHistory(dailyHistory);
  const weeklyMinutes = fullWeekHistory.reduce((total, item) => total + item.minutes, 0);
  const previousAverageMinutes =
    fullWeekHistory.length > 1
      ? Math.round(
          fullWeekHistory
            .slice(0, -1)
            .reduce((total, snapshot) => total + snapshot.minutes, 0)
            / (fullWeekHistory.length - 1),
        )
      : dailyMinutes;
  const weeklySavedMinutes = blockHistory
    .filter(item => isWithinCurrentWeek(item.createdAt))
    .reduce((total, item) => total + item.durationMinutes, 0);
  const chartMaxMinutes = Math.max(...fullWeekHistory.map(snapshot => snapshot.minutes), 1);
  const streakDays = (() => {
    let streak = 0;
    const reversed = [...fullWeekHistory].reverse();

    reversed.forEach(snapshot => {
      const minutes = snapshot.minutes;
      if (minutes > 0 && minutes <= Math.max(previousAverageMinutes, dailyMinutes || 1)) {
        streak += 1;
      }
    });

    return Math.max(streak, dailyMinutes > 0 ? 1 : 0);
  })();
  const appRows = MONITORED_PACKAGE_LIST.map(packageName => {
    const minutes = toMinutes(usageStats[packageName] ?? 0);
    return {
      packageName,
      appName: PACKAGE_LABELS[packageName] ?? packageName,
      minutes,
      percent: dailyMinutes > 0 ? Math.round((minutes / dailyMinutes) * 100) : 0,
    };
  });
  const chartSummary = fullWeekHistory;

  return (
    <AppScreen>
      <View style={styles.streakBanner}>
        <Text style={styles.streakTitle}>{streakDays} Day Healthy Streak!</Text>
        <Text style={styles.streakText}>
          {dailyMinutes > 0
            ? 'You are maintaining healthier digital habits with real local usage data.'
            : 'Start tracking today to build a healthy streak.'}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <SectionCard>
          <Text style={styles.metricLabel}>Avg. Daily Videos</Text>
          <Text style={styles.metricValue}>{totalVideos}</Text>
          <Text style={[styles.metricTrend, totalVideos > 0 ? styles.metricTrendWarn : styles.metricTrendGood]}>
            {totalVideos > 0 ? `${totalVideos} videos today` : 'No videos tracked today'}
          </Text>
        </SectionCard>
        <SectionCard>
          <Text style={styles.metricLabel}>Time Saved This Week</Text>
          <Text style={styles.metricValue}>{formatMinutes(weeklySavedMinutes)}</Text>
          <Text style={styles.metricTrendGood}>
            {weeklySavedMinutes > 0 ? `Blocked ${weeklySavedMinutes} min this week` : 'No blocks recorded yet'}
          </Text>
        </SectionCard>
      </View>

      <SectionCard title="Weekly Scrolling Time">
        <Text style={styles.weeklyMeta}>Total: {weeklyMinutes} minutes in the last 7 days</Text>
        <View style={styles.weekChartWrap}>
          {chartSummary.length > 0 ? (
            chartSummary.map(item => (
              <View key={item.date} style={styles.weekChartCol}>
                <View style={styles.weekChartTrack}>
                  <View
                    style={[
                      styles.weekChartFill,
                      { height: `${Math.max((item.minutes / chartMaxMinutes) * 100, item.minutes > 0 ? 12 : 0)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.weekChartLabel}>{item.dayLabel}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No local weekly history yet.</Text>
          )}
        </View>
      </SectionCard>

      <SectionCard title="App Comparison">
        <View style={styles.comparisonTrack}>
          {appRows.map((row, index) => (
            <View
              key={`segment-${row.packageName}`}
              style={[
                styles.comparisonSegment,
                index === 0 ? styles.legendDotCyan : index === 1 ? styles.legendDotBlue : styles.legendDotSlate,
                { flex: Math.max(row.minutes, dailyMinutes === 0 ? 1 : 0) },
              ]}
            />
          ))}
        </View>

        {appRows.map((row, index) => (
          <View key={row.packageName} style={styles.legendRow}>
            <View style={styles.legendLeft}>
              <View
                style={[
                  styles.legendDot,
                  index === 0 ? styles.legendDotCyan : index === 1 ? styles.legendDotBlue : styles.legendDotSlate,
                ]}
              />
              <Text style={styles.legendLabel}>{row.appName}</Text>
            </View>
            <Text style={styles.legendValue}>{row.percent}% • {formatMinutes(row.minutes)}</Text>
          </View>
        ))}
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  streakBanner: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C9EEF4',
    backgroundColor: '#EAFBFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  streakTitle: {
    color: colors.primaryDark,
    fontSize: 17,
    fontWeight: '800',
  },
  streakText: {
    color: '#597084',
    fontSize: 13,
    lineHeight: 19,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricLabel: {
    color: '#5C6F82',
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    color: '#0B1330',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 6,
  },
  metricTrend: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  metricTrendGood: {
    color: '#1F9E69',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  metricTrendWarn: {
    color: '#E07344',
  },
  weeklyMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  weekChartWrap: {
    minHeight: 148,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 8,
  },
  weekChartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  weekChartTrack: {
    width: 18,
    height: 90,
    borderRadius: 999,
    backgroundColor: '#EDF3F6',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekChartFill: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  weekChartLabel: {
    color: '#74869B',
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonTrack: {
    height: 20,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#EDF3F6',
    marginBottom: 12,
  },
  comparisonSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF3F6',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDotCyan: {
    backgroundColor: '#21C8E6',
  },
  legendDotBlue: {
    backgroundColor: '#5E8DF7',
  },
  legendDotSlate: {
    backgroundColor: '#7B8797',
  },
  legendLabel: {
    color: '#0B1330',
    fontSize: 14,
    fontWeight: '700',
  },
  legendValue: {
    color: '#0B1330',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
