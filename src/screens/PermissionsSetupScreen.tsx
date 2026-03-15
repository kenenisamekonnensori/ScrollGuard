import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../theme/tokens';

export function PermissionsSetupScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <AppScreen
      title="Permissions Setup"
      subtitle="Enable all required permissions so ScrollGuard can track usage and protect your limits.">
      <SectionCard>
        <View style={styles.row}>
          <View style={styles.iconWrap}><Text style={styles.iconText}>📊</Text></View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Usage Access</Text>
            <Text style={styles.rowSub}>Monitor app usage to track your habits</Text>
          </View>
          <Text style={styles.statusOn}>ON</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.iconWrap}><Text style={styles.iconText}>🛡️</Text></View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Accessibility Service</Text>
            <Text style={styles.rowSub}>Allows app blocking when limit is reached</Text>
          </View>
          <Text style={styles.statusOff}>Enable</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.iconWrap}><Text style={styles.iconText}>🔔</Text></View>
          <View style={styles.rowBody}>
            <Text style={styles.rowTitle}>Notifications</Text>
            <Text style={styles.rowSub}>Warn when approaching your daily limit</Text>
          </View>
          <Text style={styles.statusOn}>ON</Text>
        </View>
      </SectionCard>

      <PrimaryButton label="Open Android Permission Settings" onPress={() => {}} />
      <PrimaryButton label="All Set" variant="secondary" onPress={() => navigation.replace('MainTabs')} />
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
  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
});