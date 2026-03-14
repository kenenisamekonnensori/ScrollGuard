import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../components/InfoCard';
import { RootStackParamList } from '../navigation/types';
import { useSettingsStore } from '../store/settingsStore';

type Props = NativeStackScreenProps<RootStackParamList, 'SettingsScreen'>;

export function SettingsScreen({ navigation }: Props): React.JSX.Element {
  const userSettings = useSettingsStore(state => state.userSettings);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Limits & Controls</Text>
        <Text style={styles.subtitle}>Current settings loaded from local MMKV storage.</Text>

        <InfoCard title="Daily app limits">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>TikTok</Text>
            <Text style={styles.metricValue}>{userSettings.tiktokLimitMinutes} min</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Instagram</Text>
            <Text style={styles.metricValue}>{userSettings.instagramLimitMinutes} min</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>YouTube</Text>
            <Text style={styles.metricValue}>{userSettings.youtubeLimitMinutes} min</Text>
          </View>
        </InfoCard>

        <InfoCard title="Lock behavior">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Lock Duration</Text>
            <Text style={styles.metricValue}>{userSettings.lockDurationMinutes} min</Text>
          </View>
          <Text style={styles.note}>When a limit is exceeded, LockScreen is shown until the timer ends.</Text>
        </InfoCard>

        <InfoCard title="Next implementation steps">
          <Text style={styles.bullet}>• Add editable form inputs for each limit value.</Text>
          <Text style={styles.bullet}>• Add permission deep links from onboarding/settings.</Text>
          <Text style={styles.bullet}>• Connect limit updates to blocking and notifications.</Text>
        </InfoCard>

        <View style={styles.actionRow}>
          <Pressable onPress={() => navigation.navigate('DashboardScreen')} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('LockScreen')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Preview Lock UI</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 14,
    color: '#374151',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  note: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#4B5563',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111827',
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});