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
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#F0F4F8',
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.titleMD,
    fontWeight: '800',
    color: '#0B1330',
    letterSpacing: -0.3,
  },
  content: {
    gap: 3,
  },
});