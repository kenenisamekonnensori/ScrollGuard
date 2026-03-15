import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { SectionCard } from '../components/ui/SectionCard';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';

export function StatsScreen(): React.JSX.Element {
  const usageStats = useUsageStore(state => state.usageStats);
  const totalTimeMinutes = Math.floor(Object.values(usageStats).reduce((total, value) => total + value, 0) / 60);

  return (
    <AppScreen
      title="Usage Analytics"
      subtitle="Track patterns, streaks, and the moments that trigger long scrolling sessions.">
      <View style={styles.streakBanner}>
        <Text style={styles.streakTitle}>🔥 5 Day Healthy Streak!</Text>
        <Text style={styles.streakSub}>You're maintaining great digital habits.</Text>
      </View>

      <View style={styles.metricCards}>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Avg. Daily Videos</Text>
          <Text style={styles.metricCardValue}>12</Text>
          <Text style={styles.metricCardTrend}>↓ 15% from last week</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricCardLabel}>Time Saved This Week</Text>
          <Text style={styles.metricCardValue}>4h 20m</Text>
          <Text style={[styles.metricCardTrend, styles.metricGood]}>↑ 12% from last week</Text>
        </View>
      </View>

      <SectionCard title="Today vs Goal">
        <MetricRow label="Today" value={`${totalTimeMinutes} min`} />
        <MetricRow label="Goal" value="40 min" muted />
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min((totalTimeMinutes / 40) * 100, 100)}%` }]} />
        </View>
      </SectionCard>

      <SectionCard title="Weekly Snapshot">
        <MetricRow label="Total shorts" value="390" />
        <MetricRow label="Total time" value="4h 12m" />
        <MetricRow label="Best day" value="Wednesday" />
        <View style={styles.weekBars}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
            <View key={label + index} style={styles.barWrap}>
              <View style={[styles.bar, { height: [80, 36, 48, 70, 24, 76, 42][index] }]} />
              <Text style={styles.barLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Behavior Insights">
        <Text style={styles.bullet}>• Peak scrolling starts near 9:30 PM</Text>
        <Text style={styles.bullet}>• TikTok contributes around 68% of usage</Text>
        <Text style={styles.bullet}>• Hard limits reduce weekend spikes</Text>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  streakBanner: {
    borderWidth: 1,
    borderColor: '#B7EAF5',
    backgroundColor: '#EAF8FC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  streakSub: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metricCards: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7EFF4',
    backgroundColor: colors.surface,
    padding: 12,
    gap: 4,
  },
  metricCardLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  metricCardValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  metricCardTrend: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  metricGood: {
    color: '#059669',
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
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  weekBars: {
    flexDirection: 'row',
    height: 104,
    marginTop: 8,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  barWrap: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  bar: {
    width: 10,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: '#71DDF0',
  },
  barLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
});