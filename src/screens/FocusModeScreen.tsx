import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import {
  getResolvedAppLocks,
  ResolvedAppLock,
} from '../features/blocking/blockingController';
import { refreshMonitoringNow } from '../services/MonitoringService';
import { useSettingsStore } from '../store/settingsStore';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import {
  LIMIT_SETTING_KEYS,
  MONITORED_PACKAGE_LIST,
  PACKAGE_ICONS,
  PACKAGE_LABELS,
} from '../utils/appPackages';
import { toMinutes } from '../utils/time';

type AppFocusStatus = {
  packageName: (typeof MONITORED_PACKAGE_LIST)[number];
  appName: string;
  usageMinutes: number;
  limitMinutes: number;
  remainingMinutes: number;
  usagePercent: number;
  isBlocked: boolean;
};

const DURATION_OPTIONS = [15, 30, 60, 120] as const;

function formatRemainingMinutes(minutes: number): string {
  return `${Math.max(minutes, 0)} min`;
}

function formatClockTime(timestamp: number | null): string {
  if (!timestamp) {
    return 'native protection active';
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FocusModeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [nowMs, setNowMs] = React.useState(() => Date.now());
  const [activeLocks, setActiveLocks] = React.useState<ResolvedAppLock[]>([]);
  const usageStats = useUsageStore(state => state.usageStats);
  const lastSyncedAt = useUsageStore(state => state.lastSyncedAt);
  const userSettings = useSettingsStore(state => state.userSettings);
  const updateLimit = useSettingsStore(state => state.updateLimit);

  const refreshLocks = React.useCallback(async (): Promise<void> => {
    try {
      const resolvedLocks = await getResolvedAppLocks();
      setActiveLocks(resolvedLocks);
    } catch (error) {
      if (__DEV__) {
        console.warn('[FocusModeScreen] Failed to resolve active locks.', error);
      }
      setActiveLocks([]);
    }
  }, []);

  React.useEffect(() => {
    if (!isFocused) {
      return;
    }

    setNowMs(Date.now());

    refreshMonitoringNow().catch(error => {
      if (__DEV__) {
        console.warn('[FocusModeScreen] Initial focus refresh failed.', error);
      }
    });
    refreshLocks().catch(error => {
      if (__DEV__) {
        console.warn('[FocusModeScreen] Initial lock refresh failed.', error);
      }
    });

    const secondTickTimer = setInterval(() => {
      setNowMs(Date.now());
    }, 1_000);

    const refreshTimer = setInterval(() => {
      refreshLocks().catch(error => {
        if (__DEV__) {
          console.warn('[FocusModeScreen] Scheduled lock refresh failed.', error);
        }
      });
    }, 5_000);

    return () => {
      clearInterval(secondTickTimer);
      clearInterval(refreshTimer);
    };
  }, [isFocused, refreshLocks]);

  const appStatuses: AppFocusStatus[] = MONITORED_PACKAGE_LIST.map(packageName => {
    const appName = PACKAGE_LABELS[packageName] ?? packageName;
    const usageMinutes = toMinutes(usageStats[packageName] ?? 0);
    const limitKey = LIMIT_SETTING_KEYS[packageName];
    const limitMinutes = userSettings[limitKey];
    const remainingMinutes = Math.max(limitMinutes - usageMinutes, 0);
    const usagePercent = limitMinutes > 0 ? Math.min((usageMinutes / limitMinutes) * 100, 100) : 0;

    return {
      packageName,
      appName,
      usageMinutes,
      limitMinutes,
      remainingMinutes,
      usagePercent,
      isBlocked: activeLocks.some(lock => lock.packageName === packageName),
    };
  }).sort((first, second) => second.usagePercent - first.usagePercent);

  const shortestActiveLock = activeLocks[0];
  const mostAtRisk = appStatuses[0];
  const syncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not synced yet';

  const heroTitle = activeLocks.length > 0 ? 'Focus Active' : 'Focus Ready';
  const heroValue = activeLocks.length > 0
    ? formatRemainingMinutes(
        shortestActiveLock?.lockedUntil
          ? Math.max(Math.ceil((shortestActiveLock.lockedUntil - nowMs) / 60_000), 0)
          : 0,
      )
    : formatRemainingMinutes(mostAtRisk?.remainingMinutes ?? 0);
  const heroSub = activeLocks.length > 0
    ? `${shortestActiveLock?.appName ?? 'App'} is blocked until ${formatClockTime(shortestActiveLock?.lockedUntil ?? null)}`
    : mostAtRisk
      ? `${mostAtRisk.appName} has ${mostAtRisk.remainingMinutes} min left before lock`
      : 'No monitored app usage yet';

  return (
    <AppScreen
      title="Focus Mode"
      subtitle="Create intentional sessions that block high-distraction apps while you work.">
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{heroTitle.toUpperCase()}</Text>
        <Text style={styles.heroValue}>{heroValue}</Text>
        <Text style={styles.heroText}>{heroSub}</Text>
        <Text style={styles.heroMeta}>Last sync: {syncLabel}</Text>
      </View>

      <SectionCard title="Set Focus Duration">
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map(option => {
            const selected = option === userSettings.lockDurationMinutes;
            return (
              <Pressable
                key={option}
                onPress={() => updateLimit('lockDurationMinutes', option)}
                style={[styles.durationChip, selected ? styles.durationChipActive : null]}>
                <Text style={[styles.durationLabel, selected ? styles.durationLabelActive : null]}>
                  {option}
                </Text>
                <Text style={[styles.durationMeta, selected ? styles.durationMetaActive : null]}>
                  mins
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.sectionHint}>
          Tap a duration to update focus protection instantly. Settings stays in sync automatically.
        </Text>
      </SectionCard>

      <SectionCard title="Apps to Protect">
        {appStatuses.map(status => (
          <View key={status.packageName} style={styles.appRow}>
            <View style={styles.appLeft}>
              <View style={styles.appIconWrap}>
                <Text style={styles.appIcon}>{PACKAGE_ICONS[status.packageName] ?? '📱'}</Text>
              </View>
              <View style={styles.appCopy}>
                <Text style={styles.appName}>{status.appName}</Text>
                <Text style={styles.appSub}>
                  {status.usageMinutes}/{status.limitMinutes} min used
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                status.isBlocked ? styles.statusBadgeDanger : styles.statusBadgeSafe,
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  status.isBlocked ? styles.statusBadgeTextDanger : styles.statusBadgeTextSafe,
                ]}>
                {status.isBlocked ? 'Blocked' : `${status.remainingMinutes} min left`}
              </Text>
            </View>
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Blocked Apps">
        {activeLocks.length > 0 ? (
          activeLocks.map(lock => (
            <View key={lock.packageName} style={styles.lockRow}>
              <Text style={styles.lockName}>{lock.appName}</Text>
              <Text style={styles.lockMeta}>
                {lock.lockedUntil
                  ? `${formatRemainingMinutes(
                      Math.max(Math.ceil((lock.lockedUntil - nowMs) / 60_000), 0),
                    )} left • until ${formatClockTime(lock.lockedUntil)}`
                  : 'Blocked by native protection service'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No apps are currently blocked.</Text>
        )}
      </SectionCard>

      <PrimaryButton
        label="Refresh Focus Data"
        onPress={() => {
          refreshMonitoringNow().catch(error => {
            if (__DEV__) {
              console.warn('[FocusModeScreen] Failed to refresh focus data.', error);
            }
          });
          refreshLocks().catch(error => {
            if (__DEV__) {
              console.warn('[FocusModeScreen] Failed to refresh lock state.', error);
            }
          });
        }}
      />
      <PrimaryButton
        label="Customize Rules"
        variant="secondary"
        onPress={() => navigation.navigate('SettingsScreen')}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#BEEAF5',
    backgroundColor: '#EAFBFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
  heroEyebrow: {
    color: '#22B8D6',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  heroValue: {
    color: '#0B1330',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.6,
  },
  heroText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  heroMeta: {
    color: '#7C8CA5',
    fontSize: 12,
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  durationChip: {
    flex: 1,
    minWidth: 64,
    borderRadius: 18,
    backgroundColor: '#EDF9FC',
    borderWidth: 1,
    borderColor: '#D5EEF4',
    paddingVertical: 12,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  durationLabel: {
    color: '#0B1330',
    fontSize: 18,
    fontWeight: '800',
  },
  durationLabelActive: {
    color: colors.white,
  },
  durationMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  durationMetaActive: {
    color: '#D8FAFF',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF3F6',
  },
  appLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#F4FBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: {
    fontSize: 18,
  },
  appCopy: {
    flex: 1,
  },
  appName: {
    color: '#0B1330',
    fontSize: 15,
    fontWeight: '800',
  },
  appSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusBadgeSafe: {
    backgroundColor: '#EFFAFE',
  },
  statusBadgeDanger: {
    backgroundColor: '#FFF4E8',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadgeTextSafe: {
    color: '#0C6B86',
  },
  statusBadgeTextDanger: {
    color: '#C97415',
  },
  lockRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF3F6',
    gap: 2,
  },
  lockName: {
    color: '#0B1330',
    fontSize: 14,
    fontWeight: '800',
  },
  lockMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
