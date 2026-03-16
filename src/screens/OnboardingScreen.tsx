import React from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors, typography } from '../theme/tokens';
import { useNavigation } from '@react-navigation/native';

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
          console.warn('[OnboardingScreen] Failed to open Android intent and app settings fallback.');
        }
        return;
      }
    }
  }

  try {
    await Linking.openSettings();
  } catch {
    if (__DEV__) {
      console.warn('[OnboardingScreen] Failed to open app settings for current platform.');
    }
  }
}

async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {
    if (__DEV__) {
      console.warn('[OnboardingScreen] Failed to open app settings.');
    }
  }
}

export function OnboardingScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <AppScreen
      title="Break the Scroll Loop"
      subtitle="Understand your usage, enable required permissions, and set limits that protect your focus.">
      <View style={styles.heroPanel}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroTitle}>Endless scrolling is stealing your time</Text>
        <Text style={styles.heroCaption}>Short-video apps are built to keep you hooked. ScrollGuard helps you break the cycle.</Text>
      </View>

      <SectionCard title="Step 1 — The problem">
        <Text style={styles.body}>Infinite feeds are engineered to keep you engaged.</Text>
        <Text style={styles.bullet}>• “5 minutes” often becomes 1+ hour.</Text>
        <Text style={styles.bullet}>• Time feels invisible while scrolling.</Text>
      </SectionCard>

      <SectionCard title="Step 2 — Tracking with clarity">
        <Text style={styles.body}>ScrollGuard shows:</Text>
        <Text style={styles.bullet}>• Daily time in TikTok / Instagram / YouTube</Text>
        <Text style={styles.bullet}>• Estimated videos watched</Text>
        <Text style={styles.bullet}>• Warning and lock thresholds</Text>
      </SectionCard>

      {Platform.OS === 'android' ? (
        <SectionCard title="Required permissions">
          <Text style={styles.body}>ScrollGuard needs these Android permissions to work correctly:</Text>
          <Text style={styles.bullet}>• Usage Access — read app usage duration</Text>
          <Text style={styles.bullet}>• Accessibility Service — detect scroll/foreground app</Text>
          <Text style={styles.bullet}>• Notifications — send warnings and limit alerts</Text>
          <Text style={styles.note}>
            For notifications, open app settings and enable Notifications for ScrollGuard.
          </Text>

          <PrimaryButton
            label="Open Usage Access Settings"
            variant="secondary"
            onPress={() => void openAndroidSettings('android.settings.USAGE_ACCESS_SETTINGS')}
          />
          <PrimaryButton
            label="Open Accessibility Settings"
            variant="secondary"
            onPress={() => void openAndroidSettings('android.settings.ACCESSIBILITY_SETTINGS')}
          />
          <PrimaryButton
            label="Open App Settings (Notifications)"
            variant="secondary"
            onPress={() => void openAppSettings()}
          />
        </SectionCard>
      ) : (
        <SectionCard title="Required permissions">
          <Text style={styles.body}>To use ScrollGuard on iOS, allow notifications in app settings.</Text>
          <Text style={styles.note}>
            iOS limits system-level usage tracking and app-blocking compared to Android.
          </Text>
          <PrimaryButton
            label="Open App Settings"
            variant="secondary"
            onPress={() => void openAppSettings()}
          />
        </SectionCard>
      )}

      <View style={styles.stepRow}>
        <View style={[styles.stepDot, styles.stepActive]} />
        <View style={styles.stepDot} />
        <View style={styles.stepDot} />
      </View>

      <PrimaryButton
        label="Continue to Permissions"
        onPress={() => navigation.navigate('PermissionsSetupScreen')}
      />
      <PrimaryButton label="I already have an account" variant="ghost" onPress={() => navigation.navigate('LoginScreen')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  heroPanel: {
    position: 'relative',
    backgroundColor: '#E7F9FD',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAECF5',
    overflow: 'hidden',
    gap: 8,
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 999,
    backgroundColor: '#C8F3FB',
    right: -65,
    top: -85,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  heroCaption: {
    fontSize: typography.body,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: '88%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 2,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#B6DCE4',
  },
  stepActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});