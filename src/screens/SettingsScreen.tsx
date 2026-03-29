import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { getLockState, unblockApp } from '../features/blocking/blockingController';
import { isAppBlocked as isAppBlockedNative } from '../native/NativeBridgeService';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/tokens';
import { MONITORED_PACKAGE_LIST, PACKAGE_ICONS, PACKAGE_LABELS } from '../utils/appPackages';

// A moderate interval reduces repeated MMKV/native calls while keeping lock state reasonably fresh.
const ACTIVE_LOCKS_REFRESH_MS = 10_000;

type SettingLimitKey =
  | 'tiktokLimitMinutes'
  | 'instagramLimitMinutes'
  | 'youtubeLimitMinutes'
  | 'lockDurationMinutes';

type ActiveLockItem = {
  packageName: (typeof MONITORED_PACKAGE_LIST)[number];
  appName: string;
  lockedUntil: number | null;
};

type LimitControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onDecrease: () => void;
  onIncrease: () => void;
};

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
      <Text style={styles.limitLabel}>{label}</Text>
      <View style={styles.stepperWrap}>
        <Pressable
          disabled={disableDecrease}
          onPress={onDecrease}
          style={[styles.stepperButton, disableDecrease ? styles.stepperButtonDisabled : null]}>
          <Text style={styles.stepperSymbol}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value} min</Text>
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
  const [activeLocks, setActiveLocks] = useState<ActiveLockItem[]>([]);
  const isMountedRef = useRef(true);

  const adjustLimit = (key: SettingLimitKey, delta: number, min: number, max: number): void => {
    const nextValue = Math.max(min, Math.min(max, userSettings[key] + delta));
    updateLimit(key, nextValue);
  };

  const refreshActiveLocks = useCallback(async (): Promise<void> => {
    try {
      const locks: ActiveLockItem[] = [];

      for (const packageName of MONITORED_PACKAGE_LIST) {
        const lockState = getLockState(packageName);
        if (lockState) {
          locks.push({
            packageName,
            appName: PACKAGE_LABELS[packageName] ?? packageName,
            lockedUntil: lockState.lockedUntil,
          });
          continue;
        }

        const nativeBlocked = await isAppBlockedNative(packageName);
        if (nativeBlocked) {
          locks.push({
            packageName,
            appName: PACKAGE_LABELS[packageName] ?? packageName,
            lockedUntil: null,
          });
        }
      }

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
      await unblockApp(packageName);
      await refreshActiveLocks();
    } catch (error) {
      if (__DEV__) {
        console.warn('[SettingsScreen] Failed to unlock app.', error);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    void refreshActiveLocks();

    const interval = setInterval(() => {
      void refreshActiveLocks();
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
      / 3,
  );

  const protectionStatus =
    activeLocks.length === 0
      ? 'No active app locks right now'
      : `${activeLocks.length} active lock${activeLocks.length > 1 ? 's' : ''} currently enforced`;

  return (
    <AppScreen
      title="Settings"
      subtitle="Customize limits, lock behavior, alerts, and account controls.">
      <SectionCard>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryChip, styles.summaryChipBlue]}>
            <Text style={styles.summaryChipLabel}>Avg daily limit</Text>
            <Text style={styles.summaryChipValue}>{averageDailyLimit} min</Text>
          </View>
          <View style={[styles.summaryChip, styles.summaryChipGreen]}>
            <Text style={styles.summaryChipLabel}>Lock duration</Text>
            <Text style={styles.summaryChipValue}>{userSettings.lockDurationMinutes} min</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard title="Protection Status">
        <View
          style={[
            styles.protectionStatusBox,
            activeLocks.length > 0 ? styles.protectionStatusWarn : styles.protectionStatusSafe,
          ]}>
          <Text style={styles.protectionStatusTitle}>
            {activeLocks.length > 0 ? 'Focus shield active' : 'Focus shield ready'}
          </Text>
          <Text style={styles.protectionStatusText}>{protectionStatus}</Text>
          <Text style={styles.protectionStatusHint}>All checks are local-first and work in Guest Mode.</Text>
        </View>
      </SectionCard>

      <Text style={styles.sectionLabel}>Usage Limits</Text>
      <SectionCard title="Daily Limits">
        <LimitControl
          label="TikTok limit"
          value={userSettings.tiktokLimitMinutes}
          min={5}
          max={180}
          onDecrease={() => adjustLimit('tiktokLimitMinutes', -5, 5, 180)}
          onIncrease={() => adjustLimit('tiktokLimitMinutes', 5, 5, 180)}
        />
        <LimitControl
          label="Instagram limit"
          value={userSettings.instagramLimitMinutes}
          min={5}
          max={180}
          onDecrease={() => adjustLimit('instagramLimitMinutes', -5, 5, 180)}
          onIncrease={() => adjustLimit('instagramLimitMinutes', 5, 5, 180)}
        />
        <LimitControl
          label="YouTube limit"
          value={userSettings.youtubeLimitMinutes}
          min={5}
          max={180}
          onDecrease={() => adjustLimit('youtubeLimitMinutes', -5, 5, 180)}
          onIncrease={() => adjustLimit('youtubeLimitMinutes', 5, 5, 180)}
        />
      </SectionCard>

      <Text style={styles.sectionLabel}>Focus Mode</Text>
      <SectionCard title="Protection Rules">
        <LimitControl
          label="Lock duration"
          value={userSettings.lockDurationMinutes}
          min={5}
          max={120}
          onDecrease={() => adjustLimit('lockDurationMinutes', -5, 5, 120)}
          onIncrease={() => adjustLimit('lockDurationMinutes', 5, 5, 120)}
        />
        <MetricRow label="Warnings" value="50%, 75%, 100%" />
        <Text style={styles.note}>When a limit is exceeded, lock overlay blocks the selected app until timer ends.</Text>
      </SectionCard>

      <SectionCard title="Active App Locks">
        {activeLocks.length > 0 ? (
          activeLocks.map(lock => (
            <View key={lock.packageName} style={styles.lockRow}>
              <View style={styles.lockTopRow}>
                <View style={styles.lockInfoWrap}>
                  <View style={styles.lockTitleRow}>
                    <Text style={styles.lockAppIcon}>{PACKAGE_ICONS[lock.packageName] ?? '📱'}</Text>
                    <Text style={styles.lockAppName}>{lock.appName}</Text>
                  </View>
                  <Text style={styles.lockMeta}>
                    {lock.lockedUntil
                      ? `Locked until ${new Date(lock.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Blocked by native service'}
                  </Text>
                </View>
                <View style={styles.lockBadgeWrap}>
                  <Text style={styles.lockBadge}>LOCKED</Text>
                </View>
              </View>
              <PrimaryButton
                label={`Unlock ${lock.appName}`}
                variant="ghost"
                onPress={() => void handleUnlock(lock.packageName)}
              />
            </View>
          ))
        ) : (
          <Text style={styles.note}>No apps are currently blocked.</Text>
        )}
      </SectionCard>

      <Text style={styles.sectionLabel}>Account & Privacy</Text>
      <SectionCard title="Account & Privacy">
        <PrimaryButton label="Open Profile" variant="secondary" onPress={() => navigation.navigate('ProfileScreen')} />
        <PrimaryButton label="Manage Premium" variant="secondary" onPress={() => navigation.navigate('PremiumScreen')} />
        <PrimaryButton label="Permissions Setup" variant="ghost" onPress={() => navigation.navigate('PermissionsSetupScreen')} />
      </SectionCard>

      <Text style={styles.legal}>Terms of Service • Privacy Policy • ScrollGuard v2.4.0</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryChipBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  summaryChipGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },
  summaryChipLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryChipValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  protectionStatusBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  protectionStatusSafe: {
    backgroundColor: '#F0F9FF',
    borderColor: '#7DD3FC',
  },
  protectionStatusWarn: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FDBA74',
  },
  protectionStatusTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  protectionStatusText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  protectionStatusHint: {
    color: '#64748B',
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.primaryDark,
    fontWeight: '800',
    marginBottom: -4,
  },
  note: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  legal: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  limitLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
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
  stepperValue: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  lockRow: {
    gap: 8,
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lockInfoWrap: {
    gap: 2,
  },
  lockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockAppIcon: {
    fontSize: 14,
  },
  lockAppName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  lockMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  lockBadgeWrap: {
    alignItems: 'flex-end',
  },
  lockBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0C4A6E',
    backgroundColor: '#DBF4FB',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    letterSpacing: 0.4,
  },
});