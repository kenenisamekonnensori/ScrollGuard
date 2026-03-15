import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { useUsageStore } from '../store/usageStore';
import { colors, typography } from '../theme/tokens';

export function DashboardScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const totalSeconds = Object.values(usageStats).reduce((acc, value) => acc + value, 0);
  const totalVideos = Object.values(videoCounts).reduce((acc, value) => acc + value, 0);

  return (
    <AppScreen
      title="Your Focus Dashboard"
      subtitle="Live control panel for today’s short-video behavior and lock protection.">
      <SectionCard>
        <View style={styles.heroHead}>
          <Text style={styles.heroLabel}>Daily Focus</Text>
          <Text style={styles.chip}>85% Limit Used</Text>
        </View>
        <Text style={styles.heroValue}>{Math.floor(totalSeconds / 60)} min</Text>
        <Text style={styles.heroSub}>{totalVideos} videos watched • 45m remaining</Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </SectionCard>

      <View style={styles.alertBox}>
        <Text style={styles.alertText}>You've watched a lot today — consider taking a break.</Text>
      </View>

      <SectionCard title="App Breakdown">
        <View style={styles.appRow}>
          <View style={styles.appInfo}>
            <View style={styles.appIconWrap}><Text style={styles.appIcon}>▶️</Text></View>
            <View>
              <Text style={styles.appName}>TikTok</Text>
              <Text style={styles.appSub}>42 videos watched</Text>
            </View>
          </View>
          <View style={styles.appRight}>
            <Text style={styles.appTime}>1h 05m</Text>
            <View style={styles.ticks}>
              <View style={styles.tickOn} />
              <View style={styles.tickOn} />
              <View style={styles.tickOn} />
              <View style={styles.tickOff} />
            </View>
          </View>
        </View>

        <View style={styles.appRow}>
          <View style={styles.appInfo}>
            <View style={styles.appIconWrap}><Text style={styles.appIcon}>📷</Text></View>
            <View>
              <Text style={styles.appName}>Instagram</Text>
              <Text style={styles.appSub}>30 reels watched</Text>
            </View>
          </View>
          <View style={styles.appRight}>
            <Text style={styles.appTime}>45m</Text>
            <View style={styles.ticks}>
              <View style={styles.tickOn} />
              <View style={styles.tickOn} />
              <View style={styles.tickOff} />
              <View style={styles.tickOff} />
            </View>
          </View>
        </View>

        <View style={styles.appRowNoBorder}>
          <View style={styles.appInfo}>
            <View style={styles.appIconWrap}><Text style={styles.appIcon}>📺</Text></View>
            <View>
              <Text style={styles.appName}>YouTube</Text>
              <Text style={styles.appSub}>15 shorts watched</Text>
            </View>
          </View>
          <View style={styles.appRight}>
            <Text style={styles.appTime}>25m</Text>
            <View style={styles.ticks}>
              <View style={styles.tickOn} />
              <View style={styles.tickOff} />
              <View style={styles.tickOff} />
              <View style={styles.tickOff} />
            </View>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Quick Actions">
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
  heroHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    color: colors.primaryDark,
    backgroundColor: '#DDF7FD',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '700',
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
  progressTrack: {
    marginTop: 2,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D6EEF4',
    overflow: 'hidden',
  },
  progressFill: {
    width: '85%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
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
  ticks: {
    flexDirection: 'row',
    gap: 2,
  },
  tickOn: {
    width: 4,
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  tickOff: {
    width: 4,
    height: 12,
    borderRadius: 4,
    backgroundColor: '#CFE8EE',
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