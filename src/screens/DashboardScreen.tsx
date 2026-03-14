import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../components/InfoCard';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DashboardScreen'>;

export function DashboardScreen({ navigation }: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Today’s Focus Overview</Text>
        <Text style={styles.subtitle}>Live usage cards and quick actions for your scrolling limits.</Text>

        <InfoCard title="Today at a glance">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Time Spent</Text>
            <Text style={styles.metricValue}>32 min</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Videos Watched</Text>
            <Text style={styles.metricValue}>57</Text>
          </View>
        </InfoCard>

        <InfoCard title="App usage summary">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>TikTok</Text>
            <Text style={styles.metricValue}>22 min • 41 videos</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Instagram</Text>
            <Text style={styles.metricValue}>8 min • 12 videos</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>YouTube</Text>
            <Text style={styles.metricValue}>2 min • 4 videos</Text>
          </View>
        </InfoCard>

        <InfoCard title="Current status">
          <Text style={styles.statusText}>• Limits active for all monitored apps.</Text>
          <Text style={styles.statusText}>• Next warning threshold at 75% usage.</Text>
          <Text style={styles.statusText}>• Blocking service ready after limit exceeded.</Text>
        </InfoCard>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => navigation.navigate('StatsScreen')}
            style={[styles.actionButton, styles.primaryAction]}>
            <Text style={styles.primaryActionText}>Open Stats</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('SettingsScreen')}
            style={styles.actionButton}>
            <Text style={styles.secondaryActionText}>Open Settings</Text>
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
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  primaryAction: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
});