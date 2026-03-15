import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '../../theme/tokens';

type MetricRowProps = {
  label: string;
  value: string;
  muted?: boolean;
};

export function MetricRow({ label, value, muted }: MetricRowProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, muted ? styles.muted : null]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: typography.body,
    color: colors.text,
  },
  value: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
  },
});