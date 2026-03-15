import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../theme/tokens';

export function FocusModeScreen(): React.JSX.Element {
  return (
    <AppScreen
      title="Focus Mode"
      subtitle="Create intentional sessions that block high-distraction apps while you work.">
      <View style={styles.timerHero}>
        <Text style={styles.timerLabel}>Focus Active</Text>
        <Text style={styles.timerValue}>24:59</Text>
        <Text style={styles.timerSub}>Deep work in progress...</Text>
      </View>

      <SectionCard title="Set Focus Duration">
        <View style={styles.durationRow}>
          {['15m', '30m', '60m', '120m'].map(item => (
            <View key={item} style={[styles.durationChip, item === '30m' ? styles.durationChipActive : null]}>
              <Text style={[styles.durationText, item === '30m' ? styles.durationTextActive : null]}>{item}</Text>
            </View>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Session Setup">
        <MetricRow label="Duration" value="45 min" />
        <MetricRow label="Break" value="10 min" />
        <MetricRow label="Mode" value="Hard Lock" />
      </SectionCard>

      <SectionCard title="Blocked Apps">
        <Text style={styles.item}>• TikTok</Text>
        <Text style={styles.item}>• Instagram</Text>
        <Text style={styles.item}>• YouTube</Text>
      </SectionCard>

      <PrimaryButton label="Start Focus Session" onPress={() => {}} />
      <PrimaryButton label="Customize Rules" variant="secondary" onPress={() => {}} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  timerHero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B6E9F4',
    backgroundColor: '#ECF9FC',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 2,
  },
  timerLabel: {
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: '700',
  },
  timerValue: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  timerSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D4E7EC',
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F7FCFD',
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  durationTextActive: {
    color: colors.white,
  },
  item: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
