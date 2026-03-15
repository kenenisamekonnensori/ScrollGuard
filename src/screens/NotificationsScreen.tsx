import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../theme/tokens';

export function NotificationsScreen(): React.JSX.Element {
  return (
    <AppScreen
      title="Notifications Center"
      subtitle="Review warnings, lock events, streak wins, and motivation nudges.">
      <View style={styles.filterRow}>
        <Text style={[styles.filter, styles.filterActive]}>All</Text>
        <Text style={styles.filter}>Usage</Text>
        <Text style={styles.filter}>Goals</Text>
        <Text style={styles.filter}>Reminders</Text>
      </View>

      <SectionCard title="Today">
        <View style={styles.alertItem}><Text style={styles.item}>⚠️ 75% of TikTok limit reached</Text><Text style={styles.time}>10m ago</Text></View>
        <View style={styles.alertItem}><Text style={styles.item}>🧠 Focus reminder at 9:30 PM</Text><Text style={styles.time}>1h ago</Text></View>
        <View style={styles.alertItem}><Text style={styles.item}>✅ Session complete: 45 min without social apps</Text><Text style={styles.time}>3h ago</Text></View>
      </SectionCard>

      <SectionCard title="Earlier">
        <View style={styles.alertItem}><Text style={styles.item}>🔒 Lock activated for Instagram (20m)</Text><Text style={styles.time}>Yesterday</Text></View>
        <View style={styles.alertItem}><Text style={styles.item}>🔥 Streak extended to 4 days</Text><Text style={styles.time}>Yesterday</Text></View>
      </SectionCard>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filter: {
    backgroundColor: '#E8EDF2',
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterActive: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  alertItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#EAF2F4',
    gap: 3,
  },
  item: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  time: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});