import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OnboardingScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Onboarding Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});