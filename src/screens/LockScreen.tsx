import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { colors, radii, spacing } from '../theme/tokens';
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

  const displayAppName = activeApp ? APP_NAME_MAP[activeApp] ?? activeApp : 'No app';
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
          <View style={styles.visualWrap}>
            <Text style={styles.visualIcon}>✅</Text>
          </View>

          <View style={styles.lockCard}>
            <Text style={styles.title}>No Active Lock</Text>
            <Text style={styles.appName}>You currently do not have a blocked app.</Text>
            <Text style={styles.info}>
              Open this screen from an active lock event to see live countdown details.
            </Text>
          </View>

          <PrimaryButton label="Return to Dashboard" onPress={() => navigation.navigate('MainTabs')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.visualWrap}>
          <Text style={styles.visualIcon}>⏳</Text>
        </View>

        <View style={styles.lockCard}>
          <Text style={styles.title}>Time Limit Reached</Text>
          <Text style={styles.appName}>{displayAppName} is temporarily blocked to protect your focus.</Text>
          <Text style={styles.timer}>{formatRemainingTime(remainingMs)} remaining</Text>
          <Text style={styles.message}>“{message}”</Text>
          <Text style={styles.info}>
            {isStillBlocked
              ? 'Stay intentional. Access returns automatically when the timer finishes.'
              : 'Lock expired. You can return to your dashboard now.'}
          </Text>
        </View>

        <PrimaryButton label="Return to Dashboard" onPress={() => navigation.navigate('MainTabs')} />
        <PrimaryButton
          label="Unlock with Premium"
          variant="secondary"
          onPress={() => navigation.navigate('PremiumScreen')}
        />
        <Text style={styles.premiumTag}>Extend limit • PREMIUM</Text>
      </View>
    </Screen>
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