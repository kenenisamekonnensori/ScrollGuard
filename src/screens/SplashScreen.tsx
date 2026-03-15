import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../components/Screen';
import { colors } from '../theme/tokens';

export function SplashScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('OnboardingScreen');
    }, 1100);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <Screen style={styles.container}>
      <View style={styles.topBar} />
      <View style={styles.iconTile}>
        <Text style={styles.iconGlyph}>🛡️</Text>
      </View>
      <Text style={styles.logo}>ScrollGuard</Text>
      <Text style={styles.tagline}>Protecting your digital wellbeing</Text>
      <View style={styles.loaderTrack}>
        <View style={styles.loaderFill} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
    gap: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
  },
  iconTile: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#DDF7FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconGlyph: {
    fontSize: 36,
  },
  logo: {
    fontSize: 36,
    color: colors.text,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 22,
  },
  loaderTrack: {
    width: '68%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#D8EDF2',
    overflow: 'hidden',
  },
  loaderFill: {
    width: '72%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});