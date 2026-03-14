import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InfoCard } from '../components/InfoCard';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'StatsScreen'>;

export function StatsScreen({ navigation }: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Usage Insights</Text>
        <Text style={styles.subtitle}>Track daily and weekly patterns to reduce endless scrolling.</Text>

        <InfoCard title="Daily summary">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Time</Text>
            <Text style={styles.metricValue}>32 min</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Videos Watched</Text>
            <Text style={styles.metricValue}>57</Text>
          </View>
        </InfoCard>

        <InfoCard title="Weekly snapshot">
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Shorts</Text>
            <Text style={styles.metricValue}>390</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Time</Text>
            <Text style={styles.metricValue}>4h 12m</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Best Day</Text>
            <Text style={styles.metricValue}>Wednesday</Text>
          </View>
        </InfoCard>

        <InfoCard title="Behavior signals">
          <Text style={styles.bullet}>• Peak scrolling starts around 9:30 PM.</Text>
          <Text style={styles.bullet}>• TikTok contributes ~68% of total usage.</Text>
          <Text style={styles.bullet}>• You reduce usage on days with stricter limits.</Text>
        </InfoCard>

        <Pressable
          onPress={() => navigation.navigate('DashboardScreen')}
          style={styles.button}>
          <Text style={styles.buttonText}>Back to Dashboard</Text>
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
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  button: {
    marginTop: 2,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});