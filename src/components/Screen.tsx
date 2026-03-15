import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  edges?: Edge[];
};

export function Screen({ children, style, edges = ['top', 'right', 'left'] }: ScreenProps): React.JSX.Element {
  return <SafeAreaView edges={edges} style={[styles.base, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
