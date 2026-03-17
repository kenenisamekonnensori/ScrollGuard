import React from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../theme/tokens';
import {
  areNotificationsEnabled,
  getPermissionStatusSupport,
  hasUsageAccessPermission,
  isAccessibilityServiceEnabled,
} from '../native/NativeBridgeService';

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

async function openAndroidSettings(action: string): Promise<void> {
  if (Platform.OS === 'android' && typeof Linking.sendIntent === 'function') {
    try {
      await Linking.sendIntent(action);
      return;
    } catch {
      try {
        await Linking.openSettings();
        return;
      } catch {
        if (__DEV__) {
          console.warn('[PermissionsSetupScreen] Failed to open Android intent and app settings fallback.');
        }
        return;
      }
    }
  }

  try {
    await Linking.openSettings();
  } catch {
    if (__DEV__) {
      console.warn('[PermissionsSetupScreen] Failed to open app settings for current platform.');
    }
  }
}

async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    if (__DEV__) {
      console.warn('[PermissionsSetupScreen] Failed to open app settings.');
    }
  }
}

export function PermissionsSetupScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const isAndroid = Platform.OS === 'android';
  const [permissionStatus, setPermissionStatus] = React.useState<PermissionStatus>(INITIAL_PERMISSION_STATUS);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshPermissionStatus = React.useCallback(async (): Promise<PermissionStatus> => {
    setIsLoading(true);

    try {
      const permissionResults = await Promise.allSettled([
        hasUsageAccessPermission(),
        isAccessibilityServiceEnabled(),
        areNotificationsEnabled(),
      ]);

      const usageAccess = permissionResults[0].status === 'fulfilled'
        ? permissionResults[0].value
        : false;
      const accessibility = permissionResults[1].status === 'fulfilled'
        ? permissionResults[1].value
        : false;
      const notifications = permissionResults[2].status === 'fulfilled'
        ? permissionResults[2].value
        : false;

      const nextStatus: PermissionStatus = {
        usageAccess,
        accessibility,
        notifications,
      };

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
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refreshPermissionStatus();
    }, [refreshPermissionStatus]),
  );

  const permissionStatusSupport = getPermissionStatusSupport();

  // Exclude unsupported status checks from progress to avoid misleading users with false OFF states.
  const usageAccessSupported = !isAndroid || permissionStatusSupport.usageAccess;
  const accessibilitySupported = !isAndroid || permissionStatusSupport.accessibility;
  const notificationsSupported = permissionStatusSupport.notifications;

  // Completion only includes checks that are supported on the current runtime.
  const allPermissionsEnabled =
    (!isAndroid || !usageAccessSupported || permissionStatus.usageAccess)
    && (!isAndroid || !accessibilitySupported || permissionStatus.accessibility)
    && (!notificationsSupported || permissionStatus.notifications);

  const totalRequiredPermissions =
    (isAndroid && usageAccessSupported ? 1 : 0)
    + (isAndroid && accessibilitySupported ? 1 : 0)
    + (notificationsSupported ? 1 : 0);

  const completedPermissionsCount =
    (notificationsSupported && permissionStatus.notifications ? 1 : 0)
    + (isAndroid && usageAccessSupported && permissionStatus.usageAccess ? 1 : 0)
    + (isAndroid && accessibilitySupported && permissionStatus.accessibility ? 1 : 0);

  const safeTotalRequiredPermissions = Math.max(totalRequiredPermissions, 1);
  const completionPercent = Math.round((completedPermissionsCount / safeTotalRequiredPermissions) * 100);

  const firstMissingPermissionAction = async (): Promise<void> => {
    // Refresh first to avoid opening the wrong settings page due to stale state.
    const latestStatus = await refreshPermissionStatus();

    if (isAndroid) {
      if (usageAccessSupported && !latestStatus.usageAccess) {
        await openAndroidSettings('android.settings.USAGE_ACCESS_SETTINGS');
        return;
      }

      if (accessibilitySupported && !latestStatus.accessibility) {
        await openAndroidSettings('android.settings.ACCESSIBILITY_SETTINGS');
        return;
      }
    }

    if (notificationsSupported && !latestStatus.notifications) {
      await openAppSettings();
      return;
    }

    await openAppSettings();
  };

  return (
    <AppScreen
      title="Permissions Setup"
      subtitle="Enable all required permissions so ScrollGuard can track usage and protect your limits.">
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
            onPress={() => void openAndroidSettings('android.settings.USAGE_ACCESS_SETTINGS')}
          />
        ) : null}
        {isAndroid ? (
          <PrimaryButton
            label="Open Accessibility Settings"
            variant="secondary"
            onPress={() => void openAndroidSettings('android.settings.ACCESSIBILITY_SETTINGS')}
          />
        ) : null}
        <PrimaryButton
          label="Open App Settings (Notifications)"
          variant="secondary"
          onPress={() => void openAppSettings()}
        />
      </SectionCard>

      <PrimaryButton
        label="Open Missing Permission Settings"
        onPress={() => void firstMissingPermissionAction()}
      />
      <PrimaryButton
        label="Refresh Permission Status"
        variant="secondary"
        onPress={() => void refreshPermissionStatus()}
      />

      <View style={styles.progressWrap}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Setup Progress</Text>
          <Text style={styles.progressValue}>
            {isLoading
              ? 'Checking...'
              : `${completedPermissionsCount}/${safeTotalRequiredPermissions} (${completionPercent}%)`}
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

      <PrimaryButton
        label="All Set"
        variant="ghost"
        onPress={() => navigation.replace('MainTabs')}
      />
      {!allPermissionsEnabled && !isLoading ? (
        <Text style={styles.warning}>Some permissions are still off. Core tracking and blocking may not work fully.</Text>
      ) : null}
      {!isLoading && isAndroid && !permissionStatusSupport.accessibility ? (
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
});