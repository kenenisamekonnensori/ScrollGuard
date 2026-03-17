import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { MetricRow } from '../components/ui/MetricRow';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { getLockState } from '../features/blocking/blockingController';
import { refreshMonitoringNow } from '../services/MonitoringService';
import { useSettingsStore } from '../store/settingsStore';
import { useUsageStore } from '../store/usageStore';
import { colors } from '../theme/tokens';
import {
  LIMIT_SETTING_KEYS,
  MONITORED_PACKAGE_LIST,
  PACKAGE_LABELS,
} from '../utils/appPackages';
import { toMinutes } from '../utils/time';

type AppFocusStatus = {
  packageName: string;
  appName: string;
  usageMinutes: number;
  limitMinutes: number;
  remainingMinutes: number;
  usagePercent: number;
};

type ActiveLockItem = {
  packageName: (typeof MONITORED_PACKAGE_LIST)[number];
  appName: string;
  lockedUntil: number;
};

function formatRemainingMinutes(minutes: number): string {
  if (minutes <= 0) {
    return '0 min';
  }

  return `${minutes} min`;
}

export function FocusModeScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const usageStats = useUsageStore(state => state.usageStats);
  const lastSyncedAt = useUsageStore(state => state.lastSyncedAt);
  const userSettings = useSettingsStore(state => state.userSettings);

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
    };
  });

  const mostAtRisk = [...appStatuses].sort((a, b) => b.usagePercent - a.usagePercent)[0];
  const activeLocks = MONITORED_PACKAGE_LIST.reduce<ActiveLockItem[]>((result, packageName) => {
    const lockState = getLockState(packageName);
    if (!lockState) {
      return result;
    }

    result.push({
      packageName,
      appName: PACKAGE_LABELS[packageName] ?? packageName,
      lockedUntil: lockState.lockedUntil,
    });

    return result;
  }, []);

  const focusLabel = activeLocks.length > 0 ? 'Protection Active' : 'No Active Locks';
  const focusValue = mostAtRisk ? formatRemainingMinutes(mostAtRisk.remainingMinutes) : '0 min';
  const focusSub = mostAtRisk
    ? `${mostAtRisk.appName} remaining before limit lock`
    : 'No monitored app usage yet';
  const syncLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not synced yet';

  return (
    <AppScreen
      title="Focus Mode"
      subtitle="Create intentional sessions that block high-distraction apps while you work.">
      <View style={styles.timerHero}>
        <Text style={styles.timerLabel}>{focusLabel}</Text>
        <Text style={styles.timerValue}>{focusValue}</Text>
        <Text style={styles.timerSub}>{focusSub}</Text>
        <Text style={styles.timerSub}>Last sync: {syncLabel}</Text>
      </View>

      <SectionCard title="Usage Risk">
        {appStatuses.map(status => (
          <MetricRow
            key={status.packageName}
            label={status.appName}
            value={`${status.usageMinutes}/${status.limitMinutes} min`}
          />
        ))}
      </SectionCard>

      <SectionCard title="Blocked Apps">
        {activeLocks.length > 0 ? (
          activeLocks.map(lock => (
            <Text key={lock.packageName} style={styles.item}>
              • {lock.appName} (until {new Date(lock.lockedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
            </Text>
          ))
        ) : (
          <Text style={styles.item}>No apps are currently blocked.</Text>
        )}
      </SectionCard>

      <PrimaryButton label="Refresh Focus Data" onPress={() => void refreshMonitoringNow()} />
      <PrimaryButton label="Customize Rules" variant="secondary" onPress={() => navigation.navigate('Settings')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  timerHero: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#B6E9F4',
    backgroundColor: '#ECF9FC',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 2,
  },
  timerLabel: {
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    fontWeight: '700',
  },
  timerValue: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  timerSub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  item: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
});
