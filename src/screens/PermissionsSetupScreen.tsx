import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../theme/tokens';
import {
  getPermissionSnapshot,
} from '../native/NativeBridgeService';
import { openAndroidSettings, openAppSettings } from '../utils/settingsLinks';
import { resolveProtectedEntryRoute } from '../utils/appFlow';

type PermissionStatus = {
  usageAccess: boolean;
  accessibility: boolean;
  notifications: boolean;
};

const INITIAL_PERMISSION_STATUS: PermissionStatus = {
  usageAccess: false,
  accessibility: false,
  notifications: false,
};

export function PermissionsSetupScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const isAndroid = Platform.OS === 'android';
  const [permissionStatus, setPermissionStatus] = React.useState<PermissionStatus>(INITIAL_PERMISSION_STATUS);
  const [isLoading, setIsLoading] = React.useState(true);
  const [allPermissionsEnabled, setAllPermissionsEnabled] = React.useState(false);
  const [totalRequiredPermissions, setTotalRequiredPermissions] = React.useState(0);
  const [completedPermissionsCount, setCompletedPermissionsCount] = React.useState(0);
  const [completionPercent, setCompletionPercent] = React.useState(100);
  const [usageAccessSupported, setUsageAccessSupported] = React.useState(!isAndroid);
  const [accessibilitySupported, setAccessibilitySupported] = React.useState(!isAndroid);
  const [notificationsSupported, setNotificationsSupported] = React.useState(false);

  const refreshPermissionStatus = React.useCallback(async (): Promise<PermissionStatus> => {
    setIsLoading(true);

    try {
      const snapshot = await getPermissionSnapshot();

      const nextUsageAccessSupported = !isAndroid || snapshot.support.usageAccess;
      const nextAccessibilitySupported = !isAndroid || snapshot.support.accessibility;
      const nextNotificationsSupported = snapshot.support.notifications;

      const nextStatus: PermissionStatus = {
        usageAccess: snapshot.usageAccess,
        accessibility: snapshot.accessibility,
        notifications: snapshot.notifications,
      };

      setUsageAccessSupported(nextUsageAccessSupported);
      setAccessibilitySupported(nextAccessibilitySupported);
      setNotificationsSupported(nextNotificationsSupported);
      setAllPermissionsEnabled(snapshot.allRequiredPermissionsEnabled);
      setTotalRequiredPermissions(snapshot.totalRequiredPermissions);
      setCompletedPermissionsCount(snapshot.completedPermissionsCount);
      setCompletionPercent(snapshot.completionPercent);
      setPermissionStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      if (__DEV__) {
        console.warn('[PermissionsSetupScreen] Failed to refresh permission status.', error);
      }
      setPermissionStatus(INITIAL_PERMISSION_STATUS);
      return INITIAL_PERMISSION_STATUS;
    } finally {
      setIsLoading(false);
    }
  }, [isAndroid]);

  useFocusEffect(
    React.useCallback(() => {
      refreshPermissionStatus().catch(focusError => {
        if (__DEV__) {
          console.warn('[PermissionsSetupScreen] Failed to refresh on focus.', focusError);
        }
      });
    }, [refreshPermissionStatus]),
  );

  const firstMissingPermissionAction = React.useCallback(async (): Promise<void> => {
    // Refresh first to avoid opening the wrong settings page due to stale state.
    const latestStatus = await refreshPermissionStatus();

    if (isAndroid) {
      if (usageAccessSupported && !latestStatus.usageAccess) {
        await openAndroidSettings('android.settings.USAGE_ACCESS_SETTINGS', 'PermissionsSetupScreen');
        return;
      }

      if (accessibilitySupported && !latestStatus.accessibility) {
        await openAndroidSettings('android.settings.ACCESSIBILITY_SETTINGS', 'PermissionsSetupScreen');
        return;
      }
    }

    if (notificationsSupported && !latestStatus.notifications) {
      await openAppSettings('PermissionsSetupScreen');
      return;
    }

    await openAppSettings('PermissionsSetupScreen');
  }, [
    accessibilitySupported,
    isAndroid,
    notificationsSupported,
    refreshPermissionStatus,
    usageAccessSupported,
  ]);

  const handleContinue = React.useCallback((): void => {
    resolveProtectedEntryRoute()
      .then(routeName => {
        if (routeName === 'MainTabs') {
          navigation.replace(routeName);
        }
      })
      .catch(error => {
        if (__DEV__) {
          console.warn('[PermissionsSetupScreen] Failed to verify permissions on continue.', error);
        }
      });
  }, [navigation]);

  const handleOpenUsageAccessSettings = React.useCallback((): void => {
    openAndroidSettings('android.settings.USAGE_ACCESS_SETTINGS', 'PermissionsSetupScreen').catch(
      error => {
        if (__DEV__) {
          console.warn('[PermissionsSetupScreen] Failed to open usage access settings.', error);
        }
      },
    );
  }, []);

  const handleOpenAccessibilitySettings = React.useCallback((): void => {
    openAndroidSettings('android.settings.ACCESSIBILITY_SETTINGS', 'PermissionsSetupScreen').catch(
      error => {
        if (__DEV__) {
          console.warn('[PermissionsSetupScreen] Failed to open accessibility settings.', error);
        }
      },
    );
  }, []);

  const handleOpenAppSettings = React.useCallback((): void => {
    openAppSettings('PermissionsSetupScreen').catch(error => {
      if (__DEV__) {
        console.warn('[PermissionsSetupScreen] Failed to open app settings.', error);
      }
    });
  }, []);

  const handleOpenBatteryOptimizationSettings = React.useCallback((): void => {
    openAndroidSettings(
      'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
      'PermissionsSetupScreen',
    ).catch(error => {
      if (__DEV__) {
        console.warn('[PermissionsSetupScreen] Failed to open battery optimization settings.', error);
      }
    });
  }, []);

  const handleOpenFirstMissingPermission = React.useCallback((): void => {
    firstMissingPermissionAction().catch(error => {
      if (__DEV__) {
        console.warn('[PermissionsSetupScreen] Failed to open next missing permission.', error);
      }
    });
  }, [firstMissingPermissionAction]);

  const handleRefreshPermissionStatus = React.useCallback((): void => {
    refreshPermissionStatus().catch(error => {
      if (__DEV__) {
        console.warn('[PermissionsSetupScreen] Failed to refresh permission status.', error);
      }
    });
  }, [refreshPermissionStatus]);

  return (
    <AppScreen
      title="Permissions Setup"
      subtitle="Enable all required permissions so ScrollGuard can track usage and protect your limits.">
      
      <PrimaryButton
        label="All Set - Continue to App"
        variant="primary"
        onPress={handleContinue}
        disabled={isLoading || !allPermissionsEnabled}
      />

      <SectionCard>
        {isAndroid ? (
          <View style={styles.row}>
            <View style={styles.iconWrap}><Text style={styles.iconText}>📊</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Usage Access</Text>
              <Text style={styles.rowSub}>Monitor app usage to track your habits</Text>
            </View>
            <Text style={permissionStatus.usageAccess ? styles.statusOn : styles.statusOff}>
              {isLoading
                ? 'Checking...'
                : !usageAccessSupported
                  ? 'Check'
                  : permissionStatus.usageAccess
                    ? 'ON'
                    : 'Enable'}
            </Text>
          </View>
        ) : null}

        {isAndroid ? (
          <View style={styles.row}>
            <View style={styles.iconWrap}><Text style={styles.iconText}>🛡️</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>Accessibility Service</Text>
              <Text style={styles.rowSub}>Allows app blocking when limit is reached</Text>
            </View>
            <Text style={permissionStatus.accessibility ? styles.statusOn : styles.statusOff}>
              {isLoading
                ? 'Checking...'
                : !accessibilitySupported
                  ? 'Check'
                  : permissionStatus.accessibility
                    ? 'ON'
                    : 'Enable'}
            </Text>
          </View>
        ) : null}

        <View style={styles.row}>
          <View style={styles.iconWrap}><Text style={styles.iconText}>🔔</Text></View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Notifications</Text>
            <Text style={styles.rowSub}>Warn when approaching your daily limit</Text>
          </View>
          <Text style={permissionStatus.notifications ? styles.statusOn : styles.statusOff}>
            {isLoading
              ? 'Checking...'
              : !notificationsSupported
                ? 'Check'
                : permissionStatus.notifications
                  ? 'ON'
                  : 'Enable'}
          </Text>
        </View>
      </SectionCard>

      <SectionCard title="Open Specific Settings">
        {/* Direct actions let users fix any permission without waiting for step-by-step routing. */}
        {isAndroid ? (
          <PrimaryButton
            label="Open Usage Access Settings"
            variant="secondary"
            onPress={handleOpenUsageAccessSettings}
          />
        ) : null}
        {isAndroid ? (
          <PrimaryButton
            label="Open Accessibility Settings"
            variant="secondary"
            onPress={handleOpenAccessibilitySettings}
          />
        ) : null}
        <PrimaryButton
          label="Open App Settings (Notifications)"
          variant="secondary"
          onPress={handleOpenAppSettings}
        />
      </SectionCard>

      {isAndroid ? (
        <SectionCard title="Battery Optimization">
          <Text style={styles.batteryGuidance}>
            Disable battery optimization for ScrollGuard so monitoring and blocking stay reliable while running in the background.
          </Text>
          <PrimaryButton
            label="Open Battery Optimization Settings"
            variant="secondary"
            onPress={handleOpenBatteryOptimizationSettings}
          />
        </SectionCard>
      ) : null}

      <PrimaryButton
        label="Open Missing Permission Settings"
        onPress={handleOpenFirstMissingPermission}
      />
      <PrimaryButton
        label="Refresh Permission Status"
        variant="secondary"
        onPress={handleRefreshPermissionStatus}
      />

      {totalRequiredPermissions > 0 ? (
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Setup Progress</Text>
            <Text style={styles.progressValue}>
              {isLoading
                ? 'Checking...'
                : `${completedPermissionsCount}/${totalRequiredPermissions} (${completionPercent}%)`}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${isLoading ? 0 : completionPercent}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.footer}>Permission status checks are unavailable on this build.</Text>
      )}

      {!allPermissionsEnabled && !isLoading ? (
        <Text style={styles.warning}>Some permissions are still off. Core tracking and blocking may not work fully.</Text>
      ) : null}
      {!isLoading && isAndroid && !accessibilitySupported ? (
        <Text style={styles.footer}>Accessibility status check requires a rebuilt app binary; use Refresh after rebuilding.</Text>
      ) : null}
      <Text style={styles.footer}>You can change these permissions anytime in Settings.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  statusOn: {
    fontSize: 11,
    color: '#0E7490',
    backgroundColor: '#D8F3FA',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
  },
  statusOff: {
    fontSize: 11,
    color: colors.white,
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    fontWeight: '600',
  },
  warning: {
    textAlign: 'center',
    color: '#B45309',
    fontSize: 12,
    lineHeight: 17,
  },
  progressWrap: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  progressValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
  batteryGuidance: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
