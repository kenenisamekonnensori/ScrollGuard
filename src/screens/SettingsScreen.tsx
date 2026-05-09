import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import {
  getResolvedAppLocks,
  ResolvedAppLock,
  unblockAppFamily,
} from '../features/blocking/blockingController';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/tokens';
import { MONITORED_PACKAGE_LIST, PACKAGE_ICONS, PACKAGE_LABELS } from '../utils/appPackages';

const ACTIVE_LOCKS_REFRESH_MS = 10_000;

type SettingLimitKey =
  | 'tiktokLimitMinutes'
  | 'instagramLimitMinutes'
  | 'youtubeLimitMinutes'
  | 'lockDurationMinutes';

type LimitControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

function formatLockTime(lockedUntil: number | null): string {
  if (!lockedUntil) {
    return 'Protected by native blocker';
  }

  return `Locked until ${new Date(lockedUntil).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function LimitControl({
  label,
  value,
  min,
  max,
  onDecrease,
  onIncrease,
}: LimitControlProps): React.JSX.Element {
  const disableDecrease = value <= min;
  const disableIncrease = value >= max;

  return (
    <View style={styles.limitRow}>
      <View style={styles.limitCopy}>
        <Text style={styles.limitLabel}>{label}</Text>
        <Text style={styles.limitMeta}>{value} min</Text>
      </View>
      <View style={styles.stepperWrap}>
        <Pressable
          disabled={disableDecrease}
          onPress={onDecrease}
          style={[styles.stepperButton, disableDecrease ? styles.stepperButtonDisabled : null]}>
          <Text style={styles.stepperSymbol}>−</Text>
        </Pressable>
        <Pressable
          disabled={disableIncrease}
          onPress={onIncrease}
          style={[styles.stepperButton, disableIncrease ? styles.stepperButtonDisabled : null]}>
          <Text style={styles.stepperSymbol}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const userSettings = useSettingsStore(state => state.userSettings);
  const updateLimit = useSettingsStore(state => state.updateLimit);
  const [activeLocks, setActiveLocks] = useState<ResolvedAppLock[]>([]);
  const isMountedRef = useRef(true);

  const adjustLimit = (key: SettingLimitKey, delta: number, min: number, max: number): void => {
    const nextValue = Math.max(min, Math.min(max, userSettings[key] + delta));
    updateLimit(key, nextValue);
  };

  const refreshActiveLocks = useCallback(async (): Promise<void> => {
    try {
      const locks = await getResolvedAppLocks();
      if (isMountedRef.current) {
        setActiveLocks(locks);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[SettingsScreen] Failed to refresh active locks.', error);
      }
      if (isMountedRef.current) {
        setActiveLocks([]);
      }
    }
  }, []);

  const handleUnlock = async (packageName: string): Promise<void> => {
    try {
      await unblockAppFamily(packageName);
      await refreshActiveLocks();
    } catch (error) {
      if (__DEV__) {
        console.warn('[SettingsScreen] Failed to unlock app family.', error);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    refreshActiveLocks().catch(error => {
      if (__DEV__) {
        console.warn('[SettingsScreen] Initial active-lock refresh failed.', error);
      }
    });

    const interval = setInterval(() => {
      refreshActiveLocks().catch(error => {
        if (__DEV__) {
          console.warn('[SettingsScreen] Scheduled active-lock refresh failed.', error);
        }
      });
    }, ACTIVE_LOCKS_REFRESH_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [refreshActiveLocks]);

  const averageDailyLimit = Math.round(
    (userSettings.tiktokLimitMinutes
      + userSettings.instagramLimitMinutes
      + userSettings.youtubeLimitMinutes)
      / MONITORED_PACKAGE_LIST.length,
  );

  return (
    <AppScreen
      title="Settings"
      subtitle="Customize limits, lock behavior, alerts, and account controls.">
      <SectionCard>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, styles.summaryChipBlue]}>
            <Text style={styles.summaryChipLabel}>Daily time limit</Text>
            <Text style={styles.summaryChipValue}>{averageDailyLimit} min</Text>
          </View>
          <View style={[styles.summaryChip, styles.summaryChipGreen]}>
            <Text style={styles.summaryChipLabel}>Lock duration</Text>
            <Text style={styles.summaryChipValue}>{userSettings.lockDurationMinutes} min</Text>
          </View>
        </View>
      </SectionCard>

      <Text style={styles.sectionLabel}>Usage Limits</Text>
      <SectionCard title="Daily Limits">
        <LimitControl
          label="TikTok"
          value={userSettings.tiktokLimitMinutes}
          min={5}
          max={180}
          onDecrease={() => adjustLimit('tiktokLimitMinutes', -5, 5, 180)}
          onIncrease={() => adjustLimit('tiktokLimitMinutes', 5, 5, 180)}
        />
        <LimitControl
          label="Instagram"
          value={userSettings.instagramLimitMinutes}
          min={5}
          max={180}
          onDecrease={() => adjustLimit('instagramLimitMinutes', -5, 5, 180)}
          onIncrease={() => adjustLimit('instagramLimitMinutes', 5, 5, 180)}
        />
        <LimitControl
          label="YouTube"
          value={userSettings.youtubeLimitMinutes}
          min={5}
          max={180}
          onDecrease={() => adjustLimit('youtubeLimitMinutes', -5, 5, 180)}
          onIncrease={() => adjustLimit('youtubeLimitMinutes', 5, 5, 180)}
        />
      </SectionCard>

      <Text style={styles.sectionLabel}>Focus Mode</Text>
      <SectionCard title="Protection Status">
        <View style={styles.statusHero}>
          <Text style={styles.statusHeroTitle}>
            {activeLocks.length > 0 ? 'Focus shield active' : 'Focus shield ready'}
          </Text>
          <Text style={styles.statusHeroText}>
            {activeLocks.length > 0
              ? `${activeLocks.length} app lock${activeLocks.length > 1 ? 's are' : ' is'} currently enforced`
              : 'No apps are blocked right now'}
          </Text>
          <Text style={styles.statusHeroHint}>
            Limit enforcement is local-first and keeps working through the native blocker service.
          </Text>
        </View>

        <LimitControl
          label="Lock duration"
          value={userSettings.lockDurationMinutes}
          min={5}
          max={120}
          onDecrease={() => adjustLimit('lockDurationMinutes', -5, 5, 120)}
          onIncrease={() => adjustLimit('lockDurationMinutes', 5, 5, 120)}
        />
      </SectionCard>

      <Text style={styles.sectionLabel}>Active Blocks</Text>
      <SectionCard title="Manage Blocked Apps">
        {activeLocks.length > 0 ? (
          activeLocks.map(lock => (
            <View key={lock.packageName} style={styles.lockRow}>
              <View style={styles.lockLeft}>
                <View style={styles.lockIconWrap}>
                  <Text style={styles.lockIcon}>{PACKAGE_ICONS[lock.packageName] ?? '📱'}</Text>
                </View>
                <View style={styles.lockCopy}>
                  <Text style={styles.lockName}>{lock.appName}</Text>
                  <Text style={styles.lockMeta}>{formatLockTime(lock.lockedUntil)}</Text>
                </View>
              </View>
              <PrimaryButton
                label="Unlock"
                variant="ghost"
                onPress={() => {
                  handleUnlock(lock.packageName).catch(error => {
                    if (__DEV__) {
                      console.warn('[SettingsScreen] Unlock action failed.', error);
                    }
                  });
                }}
              />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No apps are currently blocked.</Text>
        )}
      </SectionCard>

      <Text style={styles.sectionLabel}>Privacy & Account</Text>
      <SectionCard title="Account Controls">
        <PrimaryButton label="Open Profile" variant="secondary" onPress={() => navigation.navigate('ProfileScreen')} />
        {MONITORED_PACKAGE_LIST.map(packageName => (
          <View key={packageName} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{PACKAGE_LABELS[packageName]}</Text>
            <Text style={styles.infoValue}>Protected</Text>
          </View>
        ))}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Premium</Text>
          <Text style={styles.linkText} onPress={() => navigation.navigate('PremiumScreen')}>
            Manage
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Permissions</Text>
          <Text
            style={styles.linkText}
            onPress={() => navigation.navigate('PermissionsSetupScreen')}>
            Review
          </Text>
        </View>
      </SectionCard>

      <Text style={styles.legal}>Terms of Service • Privacy Policy • ScrollGuard v2.4.0</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryChip: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  summaryChipBlue: {
    backgroundColor: '#EEF7FF',
    borderColor: '#CFE5FF',
  },
  summaryChipGreen: {
    backgroundColor: '#EDFFF5',
    borderColor: '#C6F3D7',
  },
  summaryChipLabel: {
    color: '#516273',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryChipValue: {
    color: '#0B1330',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: colors.primaryDark,
    fontWeight: '800',
    marginBottom: -4,
  },
  statusHero: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F4D8A7',
    backgroundColor: '#FFF9F0',
    padding: 16,
    gap: 4,
  },
  statusHeroTitle: {
    color: '#0B1330',
    fontSize: 18,
    fontWeight: '800',
  },
  statusHeroText: {
    color: '#222F43',
    fontSize: 14,
    fontWeight: '700',
  },
  statusHeroHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  limitCopy: {
    flex: 1,
    gap: 2,
  },
  limitLabel: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  limitMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#D9E8ED',
    backgroundColor: '#F5FBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.45,
  },
  stepperSymbol: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF3F6',
  },
  lockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  lockIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#F2FBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 18,
  },
  lockCopy: {
    flex: 1,
  },
  lockName: {
    color: '#0B1330',
    fontSize: 15,
    fontWeight: '800',
  },
  lockMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF3F6',
  },
  infoLabel: {
    color: '#0B1330',
    fontSize: 14,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  linkText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '800',
  },
  legal: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
});
