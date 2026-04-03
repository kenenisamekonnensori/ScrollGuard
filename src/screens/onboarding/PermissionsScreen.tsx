import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { FeatureRow } from '../../components/onboarding/FeatureRow';
import { StepContentProps } from './types';

export function PermissionsScreen({ navigation: _navigation }: StepContentProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {Platform.OS === 'android' ? (
        <>
          <Text style={styles.sectionTitle}>Why we need access</Text>
          <Text style={styles.body}>To effectively protect your time, ScrollGuard runs quietly in the background and relies on these core systems:</Text>
          
          <View style={styles.gap}>
            <View style={styles.featureBlock}>
              <FeatureRow icon="📈" title="Usage Access" />
              <Text style={styles.description}>Tracks the exact minutes you spend in distracting apps.</Text>
            </View>

            <View >
              <FeatureRow icon="👁" title="Accessibility" />
              <Text style={styles.description}>Safely recognizes when you open a blocked app to stop you.</Text>
            </View>

            <View style={styles.featureBlock}>
              <FeatureRow icon="🔔" title="Notifications" />
              <Text style={styles.description}>Sends you gentle reminders right before your limit runs out.</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Why we need access</Text>
          <Text style={styles.body}>To effectively protect your time, ScrollGuard needs to send you alerts.</Text>
          
          <View style={styles.gap}>
            <View style={styles.featureBlock}>
              <FeatureRow icon="🔔" title="Notifications" />
              <Text style={styles.description}>Sends you gentle reminders before your limit runs out.</Text>
            </View>
          </View>
          <Text style={styles.note}>Note: iOS allows fewer background controls than Android.</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0B1330',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  body: {
    color: '#4D5F78',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 8,
  },
  gap: {
    gap: 10,
    marginTop: 12,
  },
  featureBlock: {
    gap: 2,
  },
  description: {
    color: '#8A9CB3',
    fontSize: 10,
    lineHeight: 12,
    marginLeft: 54, 
  },
  note: {
    fontSize: 8,
    lineHeight: 12,
    color: '#8A9CB3',
    marginTop: 32,
    fontStyle: 'italic',
  },
});
