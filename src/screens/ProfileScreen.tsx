import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import { BACKEND_COMING_SOON_MESSAGE } from '../utils/featureFlags';
import { toMinutes } from '../utils/time';

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const usageStats = useUsageStore(state => state.usageStats);
  const videoCounts = useUsageStore(state => state.videoCounts);
  const totalSeconds = Object.values(usageStats).reduce((total, value) => total + value, 0);
  const totalVideos = Object.values(videoCounts).reduce((total, value) => total + value, 0);

  return (
    <AppScreen title="User Profile" subtitle="Account summary, plan details, and personal focus milestones.">
      <SectionCard>
        <View style={styles.avatar}>
          <Text style={styles.initials}>G</Text>
        </View>
        <Text style={styles.name}>Guest User</Text>
        <Text style={styles.email}>Local-only mode</Text>
        <Text style={styles.memberBadge}>Backend coming soon</Text>
      </SectionCard>

      <SectionCard title="Progress">
        <MetricRow label="Time tracked today" value={`${toMinutes(totalSeconds)} min`} />
        <MetricRow label="Videos counted today" value={`${totalVideos}`} />
        <MetricRow label="Current streak" value="Coming soon" />
        <Text style={styles.progressHint}>{BACKEND_COMING_SOON_MESSAGE}</Text>
      </SectionCard>

      <SectionCard title="Subscription">
        <MetricRow label="Plan" value="Free" />
        <PrimaryButton label="Upgrade to Premium" onPress={() => navigation.navigate('PremiumScreen')} />
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
  },
  memberBadge: {
    alignSelf: 'center',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.primaryDark,
    backgroundColor: '#DDF7FD',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  progressHint: {
    marginTop: 2,
    color: '#0E7490',
    fontSize: 11,
    fontWeight: '700',
  },
});