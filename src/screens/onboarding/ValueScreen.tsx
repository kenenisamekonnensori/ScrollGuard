import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FeatureRow } from '../../components/onboarding/FeatureRow';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../theme/tokens';

export function ValueScreen(): React.JSX.Element {
  return (
    <>
      <SectionCard title="What ScrollGuard does">
        <FeatureRow icon="⏱" title="Shows where your scrolling time really goes." />
        <FeatureRow icon="⚠️" title="Warns you before you cross your limit." />
        <FeatureRow icon="🔒" title="Blocks apps when your limit is reached." />
      </SectionCard>

      <SectionCard title="Start now">
        <Text style={styles.note}>Use guest mode now. Sync can come later.</Text>
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
