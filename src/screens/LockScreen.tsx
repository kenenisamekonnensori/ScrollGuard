import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { colors, spacing } from '../theme/tokens';
import { RootStackParamList } from '../navigation/types';
import { getRandomMotivation } from '../features/motivation/motivationEngine';
import {
  getActiveLockState,
  getLockState,
  isAppBlocked,
} from '../features/blocking/blockingController';

type Props = NativeStackScreenProps<RootStackParamList, 'LockScreen'>;

const APP_NAME_MAP: Record<string, string> = {
  'com.zhiliaoapp.musically': 'TikTok',
  'com.instagram.android': 'Instagram',
  'com.google.android.youtube': 'YouTube',
};

function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function LockScreen({ navigation, route }: Props): React.JSX.Element {
  const routeApp = route.params?.app;
  const routeLockedUntil = route.params?.lockedUntil;
  const persistedLock = routeApp ? getLockState(routeApp) : getActiveLockState();
  const [now, setNow] = React.useState(Date.now());
  const [message] = React.useState(getRandomMotivation());

  const activeApp = routeApp ?? persistedLock?.app;
  const lockedUntil = routeLockedUntil ?? persistedLock?.lockedUntil;
  const hasLockContext = Boolean(activeApp && lockedUntil);
  const displayAppName = activeApp ? APP_NAME_MAP[activeApp] ?? activeApp : 'This app';
  const remainingMs = lockedUntil ? Math.max(0, lockedUntil - now) : 0;
  const isStillBlocked = activeApp ? isAppBlocked(activeApp) || remainingMs > 0 : false;

  React.useEffect(() => {
    if (!hasLockContext) {
      return;
    }

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [hasLockContext]);

  if (!hasLockContext) {
    return (
      <Screen style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.artCard}>
            <Text style={styles.artIcon}>✓</Text>
          </View>
          <Text style={styles.title}>No active lock</Text>
          <Text style={styles.subtitle}>
            Open this screen from an active block event to preview the live countdown experience.
          </Text>
          <PrimaryButton label="Go Back" onPress={() => navigation.navigate('MainTabs')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.brand}>ScrollGuard</Text>

        <View style={styles.artCard}>
          <Text style={styles.artIcon}>⏳</Text>
        </View>

        <Text style={styles.title}>You've reached your scrolling limit.</Text>
        <Text style={styles.subtitle}>
          {displayAppName} is blocked for now. Take a break. Your future self will thank you for the extra time and focus.
        </Text>

        <Text style={styles.timer}>{formatRemainingTime(remainingMs)}</Text>
        <Text style={styles.message}>{message}</Text>

        <PrimaryButton label="Go Back" onPress={() => navigation.navigate('MainTabs')} />
        <Text style={styles.premiumText}>EXTEND LIMIT</Text>
        <Text style={styles.premiumBadge}>PREMIUM</Text>
        <Text style={styles.footerNote}>
          {isStillBlocked
            ? 'Access returns automatically when the timer finishes.'
            : 'Lock expired. You can return now.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: 14,
  },
  brand: {
    textAlign: 'center',
    color: '#0B1330',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  artCard: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 300,
    alignSelf: 'center',
    borderRadius: 28,
    backgroundColor: '#DFF7FF',
    borderWidth: 1,
    borderColor: '#C9EDF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artIcon: {
    fontSize: 70,
    color: colors.primaryDark,
  },
  title: {
    textAlign: 'center',
    color: '#0B1330',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    textAlign: 'center',
    color: '#5C6F82',
    fontSize: 18,
    lineHeight: 28,
  },
  timer: {
    textAlign: 'center',
    color: colors.primaryDark,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  message: {
    textAlign: 'center',
    color: '#6A7E93',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  premiumText: {
    textAlign: 'center',
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  premiumBadge: {
    alignSelf: 'center',
    color: '#8BA2B5',
    backgroundColor: '#EEF7FA',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 10,
    fontWeight: '800',
    marginTop: -8,
  },
  footerNote: {
    textAlign: 'center',
    color: '#9AA8B8',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
});
