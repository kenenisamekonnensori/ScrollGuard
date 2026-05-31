import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { SectionCard } from '../components/ui/SectionCard';
import { getWeeklyBlockSummary } from '../features/blocking/blockingController';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import { MONITORED_PACKAGES, MONITORED_PACKAGE_LIST, PACKAGE_LABELS } from '../utils/appPackages';
import { toMinutes } from '../utils/time';

const APP_USAGE_COLORS: Record<string, string> = {
  [MONITORED_PACKAGES.tiktok]: '#21C8E6',
  [MONITORED_PACKAGES.instagram]: '#5E8DF7',
  [MONITORED_PACKAGES.youtube]: '#7B8797',
};

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

function getStartOfWeek(now = new Date()): Date {
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  const dayIndex = startOfWeek.getDay();
  const diff = (dayIndex + 6) % 7; // Monday as week start
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  return startOfWeek;
}

function getAppColor(packageName: string): string {
  return APP_USAGE_COLORS[packageName] ?? colors.primary;
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

function buildCurrentWeekUsage(
  dailyHistory: ReturnType<typeof useUsageStore.getState>['dailyHistory'],
): Array<{ date: string; totalMinutes: number; dayLabel: string; appMinutes: Record<string, number> }> {
  const historyByDate = new Map(dailyHistory.map(snapshot => [snapshot.date, snapshot]));
  const startOfWeek = getStartOfWeek();
  const days: Array<{ date: string; totalMinutes: number; dayLabel: string; appMinutes: Record<string, number> }> = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + offset);
    const dateKey = getLocalDateKey(date);
    const snapshot = historyByDate.get(dateKey);
    const appMinutes: Record<string, number> = {};
    let totalMinutes = 0;

    MONITORED_PACKAGE_LIST.forEach(packageName => {
      const minutes = toMinutes(snapshot?.usageStats?.[packageName] ?? 0);
      appMinutes[packageName] = minutes;
      totalMinutes += minutes;
    });

    days.push({
      date: dateKey,
      totalMinutes,
      dayLabel: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
      appMinutes,
    });
  }

  return days;
}

export function StatsScreen(): React.JSX.Element {
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const dailyHistory = useUsageStore(state => state.dailyHistory);
  const weeklyBlockSummary = getWeeklyBlockSummary();

  const dailyMinutes = Object.values(usageStats).reduce((total, value) => total + toMinutes(value), 0);
  const totalVideos = Object.values(videoCounts).reduce((total, value) => total + value, 0);
  const fullWeekHistory = buildLastSevenDaysHistory(dailyHistory);
  const weeklyUsageSummary = buildCurrentWeekUsage(dailyHistory);
  const weeklyMinutes = weeklyUsageSummary.reduce((total, item) => total + item.totalMinutes, 0);
  const previousAverageMinutes =
    fullWeekHistory.length > 1
      ? Math.round(
            fullWeekHistory
              .slice(0, -1)
              .reduce((total, snapshot) => total + snapshot.minutes, 0)
            / (fullWeekHistory.length - 1),
        )
      : dailyMinutes;
  const weeklySavedMinutes = weeklyBlockSummary.totalMinutes;
  const chartMaxMinutes = Math.max(...weeklyUsageSummary.map(snapshot => snapshot.totalMinutes), 1);
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
            {weeklySavedMinutes > 0
              ? `Blocked ${formatMinutes(weeklySavedMinutes)} this week`
              : 'No blocks recorded yet'}
          </Text>
        </SectionCard>
      </View>

      <SectionCard title="Weekly Scrolling Time">
        <Text style={styles.weeklyMeta}>Total: {weeklyMinutes} minutes this week</Text>
        <View style={styles.weekChartWrap}>
          {weeklyUsageSummary.map(item => {
            const barHeightPercent =
              item.totalMinutes > 0
                ? Math.max((item.totalMinutes / chartMaxMinutes) * 100, 12)
                : 0;

            return (
              <View key={item.date} style={styles.weekChartCol}>
                <View style={styles.weekChartTrack}>
                  <View style={[styles.weekChartStack, { height: `${barHeightPercent}%` }]}>
                    {MONITORED_PACKAGE_LIST.map(packageName => {
                      const minutes = item.appMinutes[packageName] ?? 0;
                      if (minutes <= 0) {
                        return null;
                      }

                      return (
                        <View
                          key={`${item.date}-${packageName}`}
                          style={[
                            styles.weekChartSegment,
                            { flex: minutes, backgroundColor: getAppColor(packageName) },
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
                <Text style={styles.weekChartLabel}>{item.dayLabel}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.weekLegendRow}>
          {MONITORED_PACKAGE_LIST.map(packageName => (
            <View key={`week-legend-${packageName}`} style={styles.weekLegendItem}>
              <View style={[styles.weekLegendSwatch, { backgroundColor: getAppColor(packageName) }]} />
              <Text style={styles.weekLegendLabel}>{PACKAGE_LABELS[packageName] ?? packageName}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="App Comparison">
        <View style={styles.comparisonTrack}>
          {appRows.map(row => (
            <View
              key={`segment-${row.packageName}`}
              style={[
                styles.comparisonSegment,
                { backgroundColor: getAppColor(row.packageName) },
                { flex: Math.max(row.minutes, dailyMinutes === 0 ? 1 : 0) },
              ]}
            />
          ))}
        </View>

        {appRows.map(row => (
          <View key={row.packageName} style={styles.legendRow}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: getAppColor(row.packageName) }]} />
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
  weekChartStack: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  weekChartSegment: {
    width: '100%',
  },
  weekChartLabel: {
    color: '#74869B',
    fontSize: 11,
    fontWeight: '700',
  },
  weekLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  weekLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekLegendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  weekLegendLabel: {
    color: '#5C6F82',
    fontSize: 12,
    fontWeight: '600',
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
