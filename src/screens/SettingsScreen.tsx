import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import {
  ResolvedAppLock,
  clearLockSourceForAllApps,
  getResolvedAppLocks,
} from '../features/blocking/blockingController';
import { useFocusSessionStore } from '../features/focus/focusSessionStore';
import { FocusSession } from '../features/focus/focusSessionTypes';
import { refreshMonitoringNow } from '../services/MonitoringService';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme/tokens';
import { MONITORED_PACKAGE_LIST, PACKAGE_ICONS, PACKAGE_LABELS } from '../utils/appPackages';

const ACTIVE_SESSIONS_REFRESH_MS = 10_000;

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

function formatSessionMeta(session: FocusSession, nowMs: number): string {
  if (session.status === 'blocked' && session.blockedUntil) {
    const remainingSeconds = Math.max(Math.ceil((session.blockedUntil - nowMs) / 1000), 0);
    return `Blocked ${Math.ceil(remainingSeconds / 60)} min left · unlocks at ${new Date(session.blockedUntil).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  if (session.status === 'blocked') {
    const blockedAt = session.blockedAt ?? session.updatedAt;
    const elapsedSeconds = Math.max(Math.floor((nowMs - blockedAt) / 1000), 0);
    const remainingSeconds = Math.max(session.blockDurationSeconds - elapsedSeconds, 0);
    return `Blocked ${Math.ceil(remainingSeconds / 60)} min left`;
  }

  if (session.status === 'tracking') {
    const remainingSeconds = Math.max(
      session.allowedUsageSeconds - session.consumedUsageSeconds,
      0,
    );
    return `${Math.ceil(remainingSeconds / 60)} min usage left`;
  }

  return 'Completed';
}

function formatRemainingLockDuration(lockedUntil: number | null, nowMs: number): string {
  if (!lockedUntil) {
    return 'Blocked now';
  }

  const remainingSeconds = Math.max(Math.ceil((lockedUntil - nowMs) / 1000), 0);
  if (remainingSeconds <= 0) {
    return 'Unlocking now';
  }

  const remainingMinutes = Math.ceil(remainingSeconds / 60);
  if (remainingMinutes >= 60) {
    const hours = Math.floor(remainingMinutes / 60);
    const minutes = remainingMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m remaining` : `${hours}h remaining`;
  }

  return `${remainingMinutes} min remaining`;
}

function formatLockMeta(lock: ResolvedAppLock, nowMs: number): string {
  const duration = formatRemainingLockDuration(lock.lockedUntil, nowMs);
  if (!lock.lockedUntil) {
    return duration;
  }

  const unlockTime = new Date(lock.lockedUntil).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${duration} - unlocks at ${unlockTime}`;
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
  const dailyLimitEnabled = useSettingsStore(state => state.userSettings.dailyLimitEnabled);
  const setDailyLimitEnabled = useSettingsStore(state => state.setDailyLimitEnabled);
  const sessions = useFocusSessionStore(state => state.sessions);
  const refreshFocusSessions = useFocusSessionStore(state => state.refreshFocusSessions);
  const completeSession = useFocusSessionStore(state => state.completeSession);
  const hasTrackingSession = React.useMemo(
    () => sessions.some(session => session.status === 'tracking'),
    [sessions],
  );
  const [dailyLimitError, setDailyLimitError] = React.useState<string | null>(null);
  const [isTogglingDailyLimit, setIsTogglingDailyLimit] = React.useState(false);
  const [activeLocks, setActiveLocks] = React.useState<ResolvedAppLock[]>([]);
  const [nowMs, setNowMs] = React.useState(() => Date.now());

  const adjustLimit = (key: SettingLimitKey, delta: number, min: number, max: number): void => {
    const nextValue = Math.max(min, Math.min(max, userSettings[key] + delta));
    updateLimit(key, nextValue);
  };

  useFocusEffect(
    useCallback(() => {
      const refreshProtectionStatus = (): void => {
        setNowMs(Date.now());
        Promise.all([
          refreshFocusSessions({ skipUsageRefresh: !hasTrackingSession }),
          getResolvedAppLocks().then(setActiveLocks),
        ]).catch(error => {
          if (__DEV__) {
            console.warn('[SettingsScreen] Failed to refresh protection status.', error);
          }
        });
      };

      refreshProtectionStatus();

      const interval = setInterval(() => {
        refreshProtectionStatus();
      }, ACTIVE_SESSIONS_REFRESH_MS);

      return () => {
        clearInterval(interval);
      };
    }, [hasTrackingSession, refreshFocusSessions]),
  );

  const refreshLocksAfterAction = React.useCallback((): void => {
    setNowMs(Date.now());
    getResolvedAppLocks()
      .then(setActiveLocks)
      .catch(error => {
        if (__DEV__) {
          console.warn('[SettingsScreen] Failed to refresh app locks.', error);
        }
      });
  }, []);

  const activeSessions = sessions.filter(session => session.status !== 'completed');
  const blockedSessionCount = activeSessions.filter(session => session.status === 'blocked').length;
  const blockedAppCount = activeLocks.length;

  const averageDailyLimit = Math.round(
    (userSettings.tiktokLimitMinutes
      + userSettings.instagramLimitMinutes
      + userSettings.youtubeLimitMinutes)
      / MONITORED_PACKAGE_LIST.length,
  );

  const handleStartDailyLimit = React.useCallback(async (): Promise<void> => {
    setDailyLimitError(null);
    setIsTogglingDailyLimit(true);

    try {
      setDailyLimitEnabled(true);
      await refreshMonitoringNow();
      refreshLocksAfterAction();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start daily limits.';
      setDailyLimitError(message);
      if (__DEV__) {
        console.warn('[SettingsScreen] Failed to start daily limits.', error);
      }
    } finally {
      setIsTogglingDailyLimit(false);
    }
  }, [refreshLocksAfterAction, setDailyLimitEnabled]);

  const handleStopDailyLimit = React.useCallback(async (): Promise<void> => {
    setDailyLimitError(null);
    setIsTogglingDailyLimit(true);

    try {
      await clearLockSourceForAllApps('dailyLimit');
      setDailyLimitEnabled(false);
      await refreshMonitoringNow();
      refreshLocksAfterAction();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to stop daily limits.';
      setDailyLimitError(message);
      if (__DEV__) {
        console.warn('[SettingsScreen] Failed to stop daily limits.', error);
      }
    } finally {
      setIsTogglingDailyLimit(false);
    }
  }, [refreshLocksAfterAction, setDailyLimitEnabled]);

  const handleEndSession = React.useCallback(async (sessionId: string): Promise<void> => {
    try {
      await completeSession(sessionId);
    } catch (error) {
      if (__DEV__) {
        console.warn('[SettingsScreen] End session action failed.', error);
      }
    } finally {
      refreshLocksAfterAction();
    }
  }, [completeSession, refreshLocksAfterAction]);

  return (
    <AppScreen>
      <SectionCard>
        <View style={styles.modeRow}>
          <View style={styles.modeCopy}>
            <Text style={styles.modeLabel}>Daily Limit Mode</Text>
            <Text style={styles.modeValue}>{dailyLimitEnabled ? 'Active' : 'Paused'}</Text>
            <Text style={styles.modeHint}>
              {dailyLimitEnabled
                ? 'Monitored apps will block as soon as they hit their daily limit.'
                : 'Daily limits stay off until you start them.'}
            </Text>
          </View>
          <View style={styles.modeAction}>
            <PrimaryButton
              label={dailyLimitEnabled ? 'Stop Daily Limit' : 'Start Daily Limit'}
              variant={dailyLimitEnabled ? 'secondary' : 'primary'}
              onPress={() => {
                dailyLimitEnabled ? handleStopDailyLimit() : handleStartDailyLimit();
              }}
              disabled={isTogglingDailyLimit}
            />
          </View>
        </View>
        {dailyLimitError ? <Text style={styles.errorText}>{dailyLimitError}</Text> : null}
      </SectionCard>

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
            {blockedAppCount > 0 || blockedSessionCount > 0
              ? 'Focus shield blocking'
              : activeSessions.length > 0
                ? 'Focus shield tracking'
                : dailyLimitEnabled
                  ? 'Protection ready'
                  : 'Protection paused'}
          </Text>
          <Text style={styles.statusHeroText}>
            {blockedAppCount > 0
              ? `${blockedAppCount} app${blockedAppCount > 1 ? 's are' : ' is'} blocked now`
              : activeSessions.length > 0
              ? `${activeSessions.length} manual session${activeSessions.length > 1 ? 's are' : ' is'} active`
              : dailyLimitEnabled
                ? 'Daily limits are active and focus sessions remain separate.'
                : 'Daily limits are paused and manual focus sessions are still available.'}
          </Text>
          <Text style={styles.statusHeroHint}>
            Tracking starts only from Focus. Completed blocks never restart automatically.
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

      <Text style={styles.sectionLabel}>Blocked Apps</Text>
      <SectionCard title="Current Blocks">
        {activeLocks.length > 0 ? (
          activeLocks.map(lock => (
            <View key={lock.packageName} style={styles.lockRow}>
              <View style={styles.lockLeft}>
                <View style={styles.lockIconWrap}>
                  <Text style={styles.lockIcon}>{PACKAGE_ICONS[lock.packageName] ?? '📱'}</Text>
                </View>
                <View style={styles.lockCopy}>
                  <Text style={styles.lockName}>{lock.appName}</Text>
                  <Text style={styles.lockMeta}>{formatLockMeta(lock, nowMs)}</Text>
                </View>
              </View>
              <View style={styles.lockBadge}>
                <Text style={styles.lockBadgeText}>Blocked</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No apps are blocked right now.</Text>
        )}
      </SectionCard>

      <Text style={styles.sectionLabel}>Manual Sessions</Text>
      <SectionCard title="Active Focus Sessions">
        {activeSessions.length > 0 ? (
          activeSessions.map(session => (
            <View key={session.id} style={styles.lockRow}>
              <View style={styles.lockLeft}>
                <View style={styles.lockIconWrap}>
                  <Text style={styles.lockIcon}>{PACKAGE_ICONS[session.packageName] ?? '📱'}</Text>
                </View>
                <View style={styles.lockCopy}>
                  <Text style={styles.lockName}>{session.appName}</Text>
                  <Text style={styles.lockMeta}>{formatSessionMeta(session, nowMs)}</Text>
                </View>
              </View>
              <PrimaryButton
                label={session.status === 'blocked' ? 'Unlock' : 'End'}
                variant="ghost"
                onPress={() => {
                  handleEndSession(session.id);
                }}
              />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No apps are currently in a manual focus session.</Text>
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
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  modeCopy: {
    flex: 1,
    gap: 3,
  },
  modeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  modeValue: {
    color: '#0B1330',
    fontSize: 22,
    fontWeight: '900',
  },
  modeHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  modeAction: {
    flexShrink: 0,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 10,
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
  lockBadge: {
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lockBadgeText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
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
