import React from 'react';
import { Alert } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors, radii } from '../theme/tokens';
import { BACKEND_COMING_SOON_MESSAGE } from '../utils/featureFlags';

export function ForgotPasswordScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();
  const handleReset = (): void => {
    Alert.alert('Coming soon', BACKEND_COMING_SOON_MESSAGE);
  };

  return (
    <AppScreen
      title="Forgot Password"
      subtitle="Password reset requires backend auth. Guest mode remains fully available.">
      <View style={styles.resetVisual}>
        <Text style={styles.resetIcon}>🔐</Text>
      </View>

      <SectionCard>
        <Text style={styles.label}>Email</Text>
        <TextInput placeholder="you@example.com" placeholderTextColor="#8B98AC" style={styles.input} />
      </SectionCard>

      <PrimaryButton label="Continue as Guest" onPress={() => navigation.replace('MainTabs')} />
      <PrimaryButton label="Send Reset Link (Coming soon)" variant="secondary" onPress={handleReset} />
      <PrimaryButton label="Back to Login" variant="ghost" onPress={() => navigation.goBack()} />
      <Text style={styles.helpText}>Having trouble? Contact ScrollGuard Support.</Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  resetVisual: {
    alignSelf: 'center',
    width: 112,
    height: 112,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#B6E9F4',
    backgroundColor: '#EAF8FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetIcon: {
    fontSize: 44,
  },
  label: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.text,
  },
  helpText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
  },
});