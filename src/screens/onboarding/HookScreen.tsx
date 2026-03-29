import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FeatureRow } from '../../components/onboarding/FeatureRow';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors, typography } from '../../theme/tokens';

export function HookScreen(): React.JSX.Element {
  return (
    <>
      <View style={styles.heroPanel}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroTitle}>Scrolling steals hours before you even feel it.</Text>
        <Text style={styles.heroCaption}>You open once. Suddenly, your evening is gone.</Text>
      </View>

      <SectionCard title="This happens to everyone">
        <Text style={styles.body}>These feeds are built to pull you back.</Text>
        <FeatureRow icon="⏱" title="Five minutes becomes an hour, fast." />
        <FeatureRow icon="😓" title="You leave tired, distracted, and behind." />
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  heroPanel: {
    position: 'relative',
    backgroundColor: '#E7F9FD',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAECF5',
    overflow: 'hidden',
    gap: 8,
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: '#C8F3FB',
    right: -65,
    top: -85,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  heroCaption: {
    fontSize: typography.body,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: '88%',
  },
});
