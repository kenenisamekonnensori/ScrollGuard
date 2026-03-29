import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FeatureRow } from '../../components/onboarding/FeatureRow';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SectionCard } from '../../components/ui/SectionCard';
import { colors } from '../../theme/tokens';
import { openAndroidSettings, openAppSettings } from '../../utils/settingsLinks';
import { StepContentProps } from './types';

export function PermissionsScreen({ navigation: _navigation }: StepContentProps): React.JSX.Element {
  return (
    <>
      {Platform.OS === 'android' ? (
        <>
          <SectionCard title="Let&apos;s set up your focus shield">
            <Text style={styles.body}>We need this to protect your focus.</Text>
          </SectionCard>

          <SectionCard title="Usage Access">
            <FeatureRow icon="📈" title="See how much time you spend in apps." />
            <View style={styles.permissionButtonWrap}>
              <PrimaryButton
                label="Open Usage Access Settings"
                variant="secondary"
                onPress={() => void openAndroidSettings('android.settings.USAGE_ACCESS_SETTINGS', 'OnboardingScreen')}
              />
            </View>
          </SectionCard>

          <SectionCard title="Accessibility">
            <FeatureRow icon="👁" title="Detect active scrolling apps in real time." />
            <View style={styles.permissionButtonWrap}>
              <PrimaryButton
                label="Open Accessibility Settings"
                variant="secondary"
                onPress={() => void openAndroidSettings('android.settings.ACCESSIBILITY_SETTINGS', 'OnboardingScreen')}
              />
            </View>
          </SectionCard>

          <SectionCard title="Notifications">
            <FeatureRow icon="🔔" title="Send reminders before you pass your limits." />
            <View style={styles.permissionButtonWrap}>
              <PrimaryButton
                label="Open App Settings (Notifications)"
                variant="secondary"
                onPress={() => void openAppSettings('OnboardingScreen')}
              />
            </View>
          </SectionCard>
        </>
      ) : (
        <SectionCard title="Let&apos;s set up your focus shield">
          <Text style={styles.body}>We need this to protect your focus.</Text>
          <Text style={styles.body}>Allow notifications to get gentle stop reminders.</Text>
          <Text style={styles.note}>iOS allows fewer controls than Android today.</Text>
          <PrimaryButton
            label="Open App Settings"
            variant="secondary"
            onPress={() => void openAppSettings('OnboardingScreen')}
          />
        </SectionCard>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  permissionButtonWrap: {
    marginTop: 4,
  },
});
