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
    borderRadius: radii.md,
    minHeight: 52,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  },
  ghostText: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.88,
  },
});