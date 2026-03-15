import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/tokens';

export function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const userSettings = useSettingsStore(state => state.userSettings);

  return (
    <AppScreen
      title="Settings"
      subtitle="Customize limits, lock behavior, alerts, and account controls.">
      <Text style={styles.sectionLabel}>Usage Limits</Text>
      <SectionCard title="Daily Limits">
        <MetricRow label="TikTok" value={`${userSettings.tiktokLimitMinutes} min`} />
        <MetricRow label="Instagram" value={`${userSettings.instagramLimitMinutes} min`} />
        <MetricRow label="YouTube" value={`${userSettings.youtubeLimitMinutes} min`} />
      </SectionCard>

      <Text style={styles.sectionLabel}>Focus Mode</Text>
      <SectionCard title="Protection Rules">
        <MetricRow label="Lock duration" value={`${userSettings.lockDurationMinutes} min`} />
        <MetricRow label="Warnings" value="50%, 75%, 100%" />
        <Text style={styles.note}>When a limit is exceeded, lock overlay blocks the selected app until timer ends.</Text>
      </SectionCard>

      <Text style={styles.sectionLabel}>Account & Privacy</Text>
      <SectionCard title="Account & Privacy">
        <PrimaryButton label="Open Profile" variant="secondary" onPress={() => navigation.navigate('ProfileScreen')} />
        <PrimaryButton label="Manage Premium" variant="secondary" onPress={() => navigation.navigate('PremiumScreen')} />
        <PrimaryButton label="Permissions Setup" variant="ghost" onPress={() => navigation.navigate('PermissionsSetupScreen')} />
      </SectionCard>

      <Text style={styles.legal}>Terms of Service • Privacy Policy • ScrollGuard v2.4.0</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.primaryDark,
    fontWeight: '800',
    marginBottom: -4,
  },
  note: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  legal: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
});