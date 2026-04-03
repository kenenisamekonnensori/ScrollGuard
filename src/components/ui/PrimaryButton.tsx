import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function PrimaryButton({ label, onPress, variant = 'primary' }: PrimaryButtonProps): React.JSX.Element {
  const buttonStyles = [
    styles.button,
    variant === 'primary' ? styles.primary : null,
    variant === 'secondary' ? styles.secondary : null,
    variant === 'ghost' ? styles.ghost : null,
  ];

  const textStyles = [
    styles.text,
    variant === 'primary' ? styles.primaryText : null,
    variant === 'secondary' ? styles.secondaryText : null,
    variant === 'ghost' ? styles.ghostText : null,
  ];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [buttonStyles, pressed ? styles.pressed : null]}>
      <Text style={textStyles}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999, // Pill shape for modern UI
    minHeight: 56,     // Slightly taller for better touch target
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#F0F4F8',
    borderColor: '#F0F4F8',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  text: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: '#0B1330',
  },
  ghostText: {
    color: '#4D5F78',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});