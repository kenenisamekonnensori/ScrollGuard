import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { colors, radii, spacing } from '../theme/tokens';

export function LockScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.visualWrap}>
          <Text style={styles.visualIcon}>⏳</Text>
        </View>

        <View style={styles.lockCard}>
          <Text style={styles.title}>Time Limit Reached</Text>
          <Text style={styles.appName}>TikTok is temporarily blocked to protect your focus.</Text>
          <Text style={styles.timer}>24m 18s remaining</Text>
          <Text style={styles.message}>“Your future is not in the feed.”</Text>
          <Text style={styles.info}>Need flexibility today? Extend limit through Premium options.</Text>
        </View>

        <PrimaryButton label="Return to Dashboard" onPress={() => navigation.navigate('MainTabs')} />
        <PrimaryButton label="Unlock with Premium" variant="secondary" onPress={() => navigation.navigate('PremiumScreen')} />
        <Text style={styles.premiumTag}>Extend limit • PREMIUM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  visualWrap: {
    alignSelf: 'center',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#E2F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  visualIcon: {
    fontSize: 46,
  },
  lockCard: {
    backgroundColor: '#132033',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#334155',
    padding: spacing.lg,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 8,
  },
  appName: {
    fontSize: 16,
    color: '#E2E8F0',
    marginBottom: 12,
  },
  timer: {
    fontSize: 30,
    fontWeight: '800',
    color: '#93C5FD',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: '#CBD5E1',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  info: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
  },
  premiumTag: {
    textAlign: 'center',
    color: '#B8EAF4',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});