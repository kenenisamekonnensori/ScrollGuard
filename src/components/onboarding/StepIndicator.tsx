import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';

type StepIndicatorProps = {
  stepKeys: string[];
  progressValue: Animated.Value;
};

export function StepIndicator({ stepKeys, progressValue }: StepIndicatorProps): React.JSX.Element {
  return (
    <View style={styles.progressRow}>
      {stepKeys.map((stepKey, index) => {
        const width = progressValue.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const backgroundColor = progressValue.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: ['#B6DCE4', colors.primary, '#B6DCE4'],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={`progress-${stepKey}`}
            style={[styles.progressDot, { width, backgroundColor }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
    marginBottom: 2,
  },
  progressDot: {
    height: 8,
    borderRadius: 999,
  },
});
