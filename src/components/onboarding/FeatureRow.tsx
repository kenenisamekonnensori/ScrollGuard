import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/tokens';

type FeatureRowProps = {
  icon: string;
  title: string;
};

export function FeatureRow({ icon, title }: FeatureRowProps): React.JSX.Element {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EBF4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 14,
  },
  featureTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: '600',
  },
});
