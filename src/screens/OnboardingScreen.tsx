import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../components/InfoCard';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingScreen'>;

export function OnboardingScreen({ navigation }: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Welcome to ScrollGuard</Text>
        <Text style={styles.subtitle}>
          Reduce short-video overuse with clear limits, real-time awareness, and lock protection.
        </Text>

        <InfoCard title="What this app tracks">
          <Text style={styles.bullet}>• Daily time spent in TikTok, Instagram, and YouTube.</Text>
          <Text style={styles.bullet}>• Estimated short videos watched through scroll activity.</Text>
          <Text style={styles.bullet}>• Lock state when your configured limit is reached.</Text>
        </InfoCard>

        <InfoCard title="Permissions you will enable">
          <Text style={styles.bullet}>• Usage Access: reads app usage duration.</Text>
          <Text style={styles.bullet}>• Accessibility Service: detects scrolls/foreground app.</Text>
          <Text style={styles.bullet}>• Notifications: sends warnings at threshold points.</Text>
        </InfoCard>

        <InfoCard title="How to test right now">
          <Text style={styles.bullet}>1. Open Dashboard to see the Phase 1–3 UI flow.</Text>
          <Text style={styles.bullet}>2. Open Stats for weekly/daily summary preview.</Text>
          <Text style={styles.bullet}>3. Open Settings to review default limits.</Text>
        </InfoCard>

        <Pressable
          onPress={() => navigation.navigate('DashboardScreen')}
          style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Continue to Dashboard</Text>
        </Pressable>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});