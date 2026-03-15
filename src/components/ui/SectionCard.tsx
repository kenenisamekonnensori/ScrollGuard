import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';

type SectionCardProps = {
  title?: string;
  children: React.ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.soft,
  },
  title: {
    fontSize: typography.titleMD,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    gap: spacing.sm,
  },
});