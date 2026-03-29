import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FeatureRow } from '../../components/onboarding/FeatureRow';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../theme/tokens';

export function AwarenessScreen(): React.JSX.Element {
  return (
    <>
      <SectionCard title="Awareness creates control">
        <FeatureRow icon="📊" title="What you measure becomes easier to change." />
        <FeatureRow icon="🛑" title="Seeing minutes helps you stop earlier." />
        <FeatureRow icon="🧠" title="Fewer loops means more calm and focus." />
      </SectionCard>

      <SectionCard title="Feel the difference">
        <Text style={styles.note}>Small daily wins become real life progress.</Text>
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
