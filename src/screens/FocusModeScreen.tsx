import React from 'react';
import {
  Animated,
  type DimensionValue,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { useFocusSessionStore } from '../features/focus/focusSessionStore';
import { FocusSession } from '../features/focus/focusSessionTypes';
import { refreshMonitoringNow } from '../services/MonitoringService';
import { colors } from '../theme/tokens';
import {
  MONITORED_PACKAGE_GROUPS,
  PACKAGE_ICONS,
  PACKAGE_LABELS,
  MonitoredAppFamily,
} from '../utils/appPackages';

type AppOption = {
  family: MonitoredAppFamily;
  appName: string;
  icon: string;
};

// Keep app choices in sync with monitored-package config so UI and tracking targets never drift.
const APP_OPTIONS: AppOption[] = (Object.keys(MONITORED_PACKAGE_GROUPS) as MonitoredAppFamily[])
  .map(family => {
    const packageName = MONITORED_PACKAGE_GROUPS[family][0];
    return {
      family,
      appName: PACKAGE_LABELS[packageName] ?? packageName,
      icon: PACKAGE_ICONS[packageName] ?? '□',
    };
  });

const USAGE_DURATION_OPTIONS = [5, 10, 15, 20, 30, 45] as const;
const BLOCK_DURATION_OPTIONS = [10, 15, 30, 45, 60, 90] as const;
const ACTIVE_SESSION_STATUSES: FocusSession['status'][] = ['tracking', 'blocked'];
const ACTIVE_POLL_INTERVAL_MS = 5_000;
const IDLE_POLL_INTERVAL_MS = 30_000;

function formatMinutesFromSeconds(seconds: number): string {
  const minutes = Math.max(Math.ceil(seconds / 60), 0);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
  }

  return `${minutes}m`;
}

function formatClock(timestamp: number | null): string {
  if (!timestamp) {
    return 'Active';
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRemainingBlockSeconds(session: FocusSession, nowMs: number): number {
  if (session.status !== 'blocked') {
    return 0;
  }

  if (session.blockedUntil) {
    return Math.max(Math.ceil((session.blockedUntil - nowMs) / 1000), 0);
  }

  const blockedAt = session.blockedAt ?? session.updatedAt;
  const elapsedSinceBlockSeconds = Math.max(
    Math.floor((nowMs - blockedAt) / 1000),
    0,
  );

  return Math.max(session.blockDurationSeconds - elapsedSinceBlockSeconds, 0);
}

function getEffectiveConsumedUsageSeconds(session: FocusSession, nowMs: number): number {
  if (session.status !== 'tracking') {
    return session.consumedUsageSeconds;
  }

  const elapsedSinceStartSeconds = Math.max(
    Math.floor((nowMs - session.startedAt) / 1000),
    0,
  );

  return Math.max(session.consumedUsageSeconds, elapsedSinceStartSeconds);
}

function getSessionTimeline(session: FocusSession, nowMs: number): {
  label: string;
  valueLabel: string;
  progress: number;
  accent: 'tracking' | 'blocked';
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
} {
  const effectiveConsumedUsageSeconds = getEffectiveConsumedUsageSeconds(session, nowMs);
  const remainingUsageSeconds = Math.max(
    session.allowedUsageSeconds - effectiveConsumedUsageSeconds,
    0,
  );
  const remainingBlockSeconds = getRemainingBlockSeconds(session, nowMs);

  if (session.status === 'blocked') {
    const blockElapsedSeconds = Math.max(session.blockDurationSeconds - remainingBlockSeconds, 0);
    return {
      label: 'Blocking time',
      valueLabel: `${formatMinutesFromSeconds(remainingBlockSeconds)} left`,
      progress: session.blockDurationSeconds > 0
        ? Math.min(blockElapsedSeconds / session.blockDurationSeconds, 1)
        : 1,
      accent: 'blocked',
      primaryMetricLabel: 'block left',
      primaryMetricValue: formatMinutesFromSeconds(remainingBlockSeconds),
      secondaryMetricLabel: 'block length',
      secondaryMetricValue: formatMinutesFromSeconds(session.blockDurationSeconds),
    };
  }

  return {
    label: 'Allowed time',
    valueLabel: `${formatMinutesFromSeconds(remainingUsageSeconds)} left`,
    progress: session.allowedUsageSeconds > 0
      ? Math.min(effectiveConsumedUsageSeconds / session.allowedUsageSeconds, 1)
      : 1,
    accent: 'tracking',
    primaryMetricLabel: 'usage left',
    primaryMetricValue: formatMinutesFromSeconds(remainingUsageSeconds),
    secondaryMetricLabel: 'block length',
    secondaryMetricValue: formatMinutesFromSeconds(session.blockDurationSeconds),
  };
}

function isActiveSession(session: FocusSession): boolean {
  return ACTIVE_SESSION_STATUSES.includes(session.status);
}

function SessionStatusBadge({
  session,
  isDark,
}: {
  session: FocusSession;
  isDark: boolean;
}): React.JSX.Element {
  // Centralized visual mapping keeps badge labels/colors consistent everywhere cards are rendered.
  const statusStyles = {
    tracking: {
      label: 'Tracking',
      badgeStyle: isDark ? styles.statusBadgeTrackingDark : styles.statusBadgeTrackingLight,
      textStyle: isDark ? styles.statusBadgeTextTrackingDark : styles.statusBadgeTextTrackingLight,
    },
    blocked: {
      label: 'Blocked',
      badgeStyle: isDark ? styles.statusBadgeBlockedDark : styles.statusBadgeBlockedLight,
      textStyle: isDark ? styles.statusBadgeTextBlockedDark : styles.statusBadgeTextBlockedLight,
    },
    completed: {
      label: 'Completed',
      badgeStyle: isDark ? styles.statusBadgeCompletedDark : styles.statusBadgeCompletedLight,
      textStyle: isDark ? styles.statusBadgeTextCompletedDark : styles.statusBadgeTextCompletedLight,
    },
    idle: {
      label: 'Idle',
      badgeStyle: isDark ? styles.statusBadgeIdleDark : styles.statusBadgeIdleLight,
      textStyle: isDark ? styles.statusBadgeTextIdleDark : styles.statusBadgeTextIdleLight,
    },
  }[session.status];

  return (
    <View style={[styles.statusBadge, statusStyles.badgeStyle]}>
      <Text style={[styles.statusBadgeText, statusStyles.textStyle]}>
        {statusStyles.label}
      </Text>
    </View>
  );
}

function FocusSessionCard({
  session,
  nowMs,
  isDark,
  isEnding,
  onComplete,
}: {
  session: FocusSession;
  nowMs: number;
  isDark: boolean;
  isEnding: boolean;
  onComplete: (sessionId: string) => void;
}): React.JSX.Element {
  const timeline = React.useMemo(
    () => getSessionTimeline(session, nowMs),
    [nowMs, session],
  );
  const progressWidthStyle = React.useMemo(
    () => ({
      width: `${Math.max(timeline.progress * 100, 4)}%` as DimensionValue,
    }),
    [timeline.progress],
  );

  return (
    <View style={[styles.sessionCard, isDark ? styles.sessionCardDark : styles.sessionCardLight]}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionIdentity}>
          <View style={[styles.sessionIcon, isDark ? styles.sessionIconDark : styles.sessionIconLight]}>
            <Text style={styles.sessionIconText}>{PACKAGE_ICONS[session.packageName] ?? '□'}</Text>
          </View>
          <View style={styles.sessionTitleWrap}>
            <Text style={[styles.sessionTitle, isDark ? styles.sessionTitleDark : styles.sessionTitleLight]}>
              {session.appName}
            </Text>
            <Text style={[styles.sessionMeta, isDark ? styles.sessionMetaDark : styles.sessionMetaLight]}>
              Started {formatClock(session.startedAt)}
            </Text>
          </View>
        </View>
        <SessionStatusBadge session={session} isDark={isDark} />
      </View>

      <View style={styles.metricGrid}>
        <View style={[styles.metricTile, isDark ? styles.metricTileDark : styles.metricTileLight]}>
          <Text style={[styles.metricValue, isDark ? styles.metricValueDark : styles.metricValueLight]}>
            {timeline.primaryMetricValue}
          </Text>
          <Text style={[styles.metricLabel, isDark ? styles.metricLabelDark : styles.metricLabelLight]}>
            {timeline.primaryMetricLabel}
          </Text>
        </View>
        <View style={[styles.metricTile, isDark ? styles.metricTileDark : styles.metricTileLight]}>
          <Text style={[styles.metricValue, isDark ? styles.metricValueDark : styles.metricValueLight]}>
            {timeline.secondaryMetricValue}
          </Text>
          <Text style={[styles.metricLabel, isDark ? styles.metricLabelDark : styles.metricLabelLight]}>
            {timeline.secondaryMetricLabel}
          </Text>
        </View>
      </View>

      <View style={styles.phaseRow}>
        <Text style={[styles.phaseLabel, isDark ? styles.phaseLabelDark : styles.phaseLabelLight]}>
          {timeline.label}
        </Text>
        <Text style={[styles.phaseValue, isDark ? styles.phaseValueDark : styles.phaseValueLight]}>
          {timeline.valueLabel}
        </Text>
      </View>

      <View
        style={[
          styles.progressTrack,
          isDark ? styles.progressTrackDark : styles.progressTrackLight,
          timeline.accent === 'blocked' ? styles.progressTrackBlocked : null,
        ]}>
        <View
          style={[
            styles.progressFill,
            timeline.accent === 'blocked' ? styles.progressFillBlocked : styles.progressFillTracking,
            progressWidthStyle,
          ]}
        />
      </View>

      <View style={styles.sessionFooter}>
        <Text style={[styles.sessionMeta, isDark ? styles.sessionMetaDark : styles.sessionMetaLight]}>
          {session.status === 'blocked'
            ? `Unlocks at ${formatClock(session.blockedUntil)}`
            : `${formatMinutesFromSeconds(getEffectiveConsumedUsageSeconds(session, nowMs))} used`}
        </Text>
        {session.status !== 'completed' ? (
          <Pressable disabled={isEnding} onPress={() => onComplete(session.id)} hitSlop={8}>
            <Text style={styles.stopText}>End</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function OptionChip<T extends number>({
  value,
  selected,
  label,
  onPress,
  isDark,
}: {
  value: T;
  selected: boolean;
  label: string;
  onPress: (value: T) => void;
  isDark: boolean;
}): React.JSX.Element {
  // These chips are reused for both usage and block-duration selectors.
  const chipStyle = selected
    ? styles.optionChipSelected
    : isDark
      ? styles.optionChipDark
      : styles.optionChipLight;
  const chipTextStyle = selected
    ? styles.optionChipTextSelected
    : isDark
      ? styles.optionChipTextDark
      : styles.optionChipTextLight;

  return (
    <Pressable onPress={() => onPress(value)} style={[styles.optionChip, chipStyle]}>
      <Text style={[styles.optionChipText, chipTextStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function FocusModeScreen(): React.JSX.Element {
  const isDark = false;
  const sessions = useFocusSessionStore(state => state.sessions);
  const startFocusSession = useFocusSessionStore(state => state.startFocusSession);
  const refreshFocusSessions = useFocusSessionStore(state => state.refreshFocusSessions);
  const completeSession = useFocusSessionStore(state => state.completeSession);
  const lastError = useFocusSessionStore(state => state.lastError);
  const [selectedFamily, setSelectedFamily] = React.useState<MonitoredAppFamily>('instagram');
  const [allowedUsageMinutes, setAllowedUsageMinutes] = React.useState(15);
  const [blockDurationMinutes, setBlockDurationMinutes] = React.useState(30);
  const [nowMs, setNowMs] = React.useState(() => Date.now());
  const [isStarting, setIsStarting] = React.useState(false);
  const [sessionActionError, setSessionActionError] = React.useState<string | null>(null);
  const [endingSessionIds, setEndingSessionIds] = React.useState<string[]>([]);
  const fadeValue = React.useRef(new Animated.Value(0)).current;
  const fadeInStyle = React.useMemo(() => ({ opacity: fadeValue }), [fadeValue]);

  // Simple one-time entry animation to make the hero/status area feel less abrupt.
  React.useEffect(() => {
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fadeValue]);

  const activeSessions = React.useMemo(
    () => sessions.filter(isActiveSession),
    [sessions],
  );
  const hasAnyActiveSession = activeSessions.length > 0;
  const hasTrackingSession = React.useMemo(
    () => sessions.some(session => session.status === 'tracking'),
    [sessions],
  );

  // Keep UI polling scoped to screen focus so hidden tabs do not continue background refresh work.
  useFocusEffect(
    React.useCallback(() => {
      setNowMs(Date.now());
      refreshFocusSessions({ skipUsageRefresh: !hasTrackingSession }).catch(error => {
        if (__DEV__) {
          console.warn('[FocusModeScreen] Failed to refresh focus sessions.', error);
        }
      });

      const pollIntervalMs = hasAnyActiveSession ? ACTIVE_POLL_INTERVAL_MS : IDLE_POLL_INTERVAL_MS;
      const timer = setInterval(() => {
        setNowMs(Date.now());
        refreshFocusSessions({ skipUsageRefresh: !hasTrackingSession }).catch(error => {
          if (__DEV__) {
            console.warn('[FocusModeScreen] Scheduled focus refresh failed.', error);
          }
        });
      }, pollIntervalMs);

      return () => {
        clearInterval(timer);
      };
    }, [hasAnyActiveSession, hasTrackingSession, refreshFocusSessions]),
  );

  // Completed list is sorted by completion timestamp so "Recent Completions" is always accurate.
  const completedSessions = React.useMemo(
    () => sessions
      .filter(session => session.status === 'completed')
      .sort((left, right) => {
        const leftCompletedAt = left.completedAt ?? left.updatedAt;
        const rightCompletedAt = right.completedAt ?? right.updatedAt;
        return rightCompletedAt - leftCompletedAt;
      })
      .slice(0, 3),
    [sessions],
  );
  const hasActiveSelectedApp = activeSessions.some(session => session.appFamily === selectedFamily);

  const handleStartFocus = React.useCallback(async (): Promise<void> => {
    setSessionActionError(null);
    setIsStarting(true);
    try {
      await startFocusSession({
        appFamily: selectedFamily,
        allowedUsageMinutes,
        blockDurationMinutes,
      });
      await refreshMonitoringNow();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start focus session.';
      setSessionActionError(message);
      if (__DEV__) {
        console.warn('[FocusModeScreen] Failed to start focus session.', error);
      }
    } finally {
      setIsStarting(false);
    }
  }, [allowedUsageMinutes, blockDurationMinutes, selectedFamily, startFocusSession]);

  const handleCompleteSession = React.useCallback(async (sessionId: string): Promise<void> => {
    setSessionActionError(null);
    setEndingSessionIds(previous => (previous.includes(sessionId) ? previous : [...previous, sessionId]));
    try {
      await completeSession(sessionId);
      await refreshMonitoringNow();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to end focus session.';
      setSessionActionError(message);
      if (__DEV__) {
        console.warn('[FocusModeScreen] Failed to end focus session.', error);
      }
    } finally {
      setEndingSessionIds(previous => previous.filter(id => id !== sessionId));
    }
  }, [completeSession]);

  return (
    <AppScreen>
      <Animated.View style={fadeInStyle}>
        <View style={[styles.hero, isDark ? styles.heroDark : styles.heroLight]}>
          <View>
            <Text style={[styles.heroEyebrow, isDark ? styles.heroEyebrowDark : styles.heroEyebrowLight]}>
              MANUAL FOCUS
            </Text>
            <Text style={[styles.heroTitle, isDark ? styles.heroTitleDark : styles.heroTitleLight]}>
              {activeSessions.length} active session{activeSessions.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={[styles.heroOrb, isDark ? styles.heroOrbDark : styles.heroOrbLight]}>
            <Text style={styles.heroOrbText}>◎</Text>
          </View>
        </View>
      </Animated.View>

      <SectionCard title="Choose App">
        <View style={styles.appSelectionGrid}>
          {APP_OPTIONS.map(option => {
            const selected = option.family === selectedFamily;
            const active = activeSessions.some(session => session.appFamily === option.family);

            return (
              <Pressable
                key={option.family}
                onPress={() => setSelectedFamily(option.family)}
                style={[
                  styles.appOption,
                  selected
                    ? isDark
                      ? styles.appOptionSelectedDark
                      : styles.appOptionSelectedLight
                    : isDark
                      ? styles.appOptionIdleDark
                      : styles.appOptionIdleLight,
                ]}>
                <Text style={styles.appOptionIcon}>{option.icon}</Text>
                <Text style={[styles.appOptionName, isDark ? styles.appOptionNameDark : styles.appOptionNameLight]}>
                  {option.appName}
                </Text>
                {active ? <Text style={styles.appOptionActive}>Active</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title="Session Setup">
        <Text style={[styles.configLabel, isDark ? styles.configLabelDark : styles.configLabelLight]}>
          Allowed usage before block
        </Text>
        <View style={styles.chipWrap}>
          {USAGE_DURATION_OPTIONS.map(value => (
            <OptionChip
              key={`usage-${value}`}
              value={value}
              selected={allowedUsageMinutes === value}
              label={`${value}m`}
              onPress={setAllowedUsageMinutes}
              isDark={isDark}
            />
          ))}
        </View>

        <Text style={[styles.configLabel, isDark ? styles.configLabelDark : styles.configLabelLight]}>
          Block duration
        </Text>
        <View style={styles.chipWrap}>
          {BLOCK_DURATION_OPTIONS.map(value => (
            <OptionChip
              key={`block-${value}`}
              value={value}
              selected={blockDurationMinutes === value}
              label={`${value}m`}
              onPress={setBlockDurationMinutes}
              isDark={isDark}
            />
          ))}
        </View>

        {sessionActionError || lastError ? (
          <Text style={styles.errorText}>{sessionActionError ?? lastError}</Text>
        ) : null}

        <PrimaryButton
          label={hasActiveSelectedApp ? 'Session Already Active' : 'Start Focus'}
          onPress={() => {
            handleStartFocus();
          }}
          disabled={hasActiveSelectedApp || isStarting}
        />
      </SectionCard>

      <SectionCard title="Active Focus">
        {activeSessions.length > 0 ? (
          <View style={styles.sessionList}>
            {activeSessions.map(session => (
              <FocusSessionCard
                key={session.id}
                session={session}
                nowMs={nowMs}
                isDark={isDark}
                isEnding={endingSessionIds.includes(session.id)}
                onComplete={sessionId => {
                  handleCompleteSession(sessionId);
                }}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, isDark ? styles.emptyTextDark : styles.emptyTextLight]}>
            No focus sessions are running. Choose an app and start one manually.
          </Text>
        )}
      </SectionCard>

      {completedSessions.length > 0 ? (
        <SectionCard title="Recent Completions">
          {completedSessions.map(session => (
            <View key={session.id} style={styles.completedRow}>
              <Text style={[styles.completedName, isDark ? styles.completedNameDark : styles.completedNameLight]}>
                {session.appName}
              </Text>
              <Text style={[styles.sessionMeta, isDark ? styles.sessionMetaDark : styles.sessionMetaLight]}>
                {formatMinutesFromSeconds(session.consumedUsageSeconds)} used
              </Text>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroDark: {
    backgroundColor: '#101827',
    borderColor: '#263244',
  },
  heroLight: {
    backgroundColor: '#EAFBFF',
    borderColor: '#BEEAF5',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroEyebrowDark: {
    color: '#67E8F9',
  },
  heroEyebrowLight: {
    color: colors.primaryDark,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroTitleDark: {
    color: '#F8FAFC',
  },
  heroTitleLight: {
    color: '#0B1330',
  },
  heroOrb: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOrbDark: {
    backgroundColor: '#050B13',
  },
  heroOrbLight: {
    backgroundColor: colors.background,
  },
  heroOrbText: {
    fontSize: 28,
    color: colors.primaryDark,
    fontWeight: '900',
  },
  appSelectionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  appOption: {
    flex: 1,
    minHeight: 104,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  appOptionSelectedDark: {
    backgroundColor: '#1E3A44',
    borderColor: colors.primary,
  },
  appOptionSelectedLight: {
    backgroundColor: '#DDF7FD',
    borderColor: colors.primary,
  },
  appOptionIdleDark: {
    backgroundColor: '#111827',
    borderColor: '#263244',
  },
  appOptionIdleLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  appOptionIcon: {
    fontSize: 24,
  },
  appOptionName: {
    fontSize: 13,
    fontWeight: '800',
  },
  appOptionNameDark: {
    color: '#F8FAFC',
  },
  appOptionNameLight: {
    color: '#0B1330',
  },
  appOptionActive: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  configLabel: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },
  configLabelDark: {
    color: '#CBD5E1',
  },
  configLabelLight: {
    color: '#475569',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  optionChip: {
    minWidth: 62,
    minHeight: 42,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipDark: {
    backgroundColor: '#172033',
    borderColor: '#263244',
  },
  optionChipLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '900',
  },
  optionChipTextSelected: {
    color: '#FFFFFF',
  },
  optionChipTextDark: {
    color: '#E2E8F0',
  },
  optionChipTextLight: {
    color: '#0B1330',
  },
  sessionList: {
    gap: 12,
  },
  sessionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  sessionCardDark: {
    backgroundColor: '#111827',
    borderColor: '#263244',
  },
  sessionCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5EDF5',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sessionIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIconDark: {
    backgroundColor: '#1F2937',
  },
  sessionIconLight: {
    backgroundColor: '#EAF8FC',
  },
  sessionIconText: {
    fontSize: 22,
  },
  sessionTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  sessionTitleDark: {
    color: '#F8FAFC',
  },
  sessionTitleLight: {
    color: '#0B1330',
  },
  sessionMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionMetaDark: {
    color: '#94A3B8',
  },
  sessionMetaLight: {
    color: '#64748B',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeTrackingDark: {
    backgroundColor: '#123342',
  },
  statusBadgeTrackingLight: {
    backgroundColor: '#DDF7FD',
  },
  statusBadgeBlockedDark: {
    backgroundColor: '#421B1B',
  },
  statusBadgeBlockedLight: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeCompletedDark: {
    backgroundColor: '#123323',
  },
  statusBadgeCompletedLight: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeIdleDark: {
    backgroundColor: '#262B35',
  },
  statusBadgeIdleLight: {
    backgroundColor: '#EEF2F7',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  statusBadgeTextTrackingDark: {
    color: '#67E8F9',
  },
  statusBadgeTextTrackingLight: {
    color: '#087B91',
  },
  statusBadgeTextBlockedDark: {
    color: '#FCA5A5',
  },
  statusBadgeTextBlockedLight: {
    color: '#B91C1C',
  },
  statusBadgeTextCompletedDark: {
    color: '#86EFAC',
  },
  statusBadgeTextCompletedLight: {
    color: '#15803D',
  },
  statusBadgeTextIdleDark: {
    color: '#CBD5E1',
  },
  statusBadgeTextIdleLight: {
    color: '#475569',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    minHeight: 76,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
  },
  metricTileDark: {
    backgroundColor: '#172033',
  },
  metricTileLight: {
    backgroundColor: '#F8FAFC',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  metricValueDark: {
    color: '#F8FAFC',
  },
  metricValueLight: {
    color: '#0B1330',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  metricLabelDark: {
    color: '#94A3B8',
  },
  metricLabelLight: {
    color: '#64748B',
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressTrackBlocked: {
    backgroundColor: '#2B1215',
  },
  progressTrackDark: {
    backgroundColor: '#263244',
  },
  progressTrackLight: {
    backgroundColor: '#E2E8F0',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressFillTracking: {
    backgroundColor: colors.primary,
  },
  progressFillBlocked: {
    backgroundColor: colors.danger,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  phaseLabelDark: {
    color: '#CBD5E1',
  },
  phaseLabelLight: {
    color: '#475569',
  },
  phaseValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  phaseValueDark: {
    color: '#94A3B8',
  },
  phaseValueLight: {
    color: '#64748B',
  },
  sessionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  emptyTextDark: {
    color: '#94A3B8',
  },
  emptyTextLight: {
    color: '#64748B',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    marginVertical: 8,
  },
  completedRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  completedName: {
    fontSize: 14,
    fontWeight: '800',
  },
  completedNameDark: {
    color: '#F8FAFC',
  },
  completedNameLight: {
    color: '#0B1330',
  },
});
