import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../theme/tokens';

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <AppScreen title="User Profile" subtitle="Account summary, plan details, and personal focus milestones.">
      <SectionCard>
        <View style={styles.avatar}>
          <Text style={styles.initials}>KS</Text>
        </View>
        <Text style={styles.name}>Kenenisa</Text>
        <Text style={styles.email}>kenenisa@scrollguard.app</Text>
        <Text style={styles.memberBadge}>Premium Member</Text>
      </SectionCard>

      <SectionCard title="Progress">
        <MetricRow label="Current streak" value="4 days" />
        <MetricRow label="Avg daily time" value="36 min" />
        <MetricRow label="Best week" value="-38% usage" />
        <Text style={styles.progressHint}>Guard Score: 94 • Time Saved: 128h</Text>
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