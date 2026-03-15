import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors, radii } from '../theme/tokens';

export function LoginScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <AppScreen title="Welcome Back" subtitle="Sign in to continue your focus journey.">
      <View style={styles.brandTile}>
        <Text style={styles.brandIcon}>🛡️</Text>
      </View>

      <SectionCard>
        <Text style={styles.label}>Email</Text>
        <TextInput placeholder="you@example.com" placeholderTextColor="#8B98AC" style={styles.input} />
        <Text style={styles.label}>Password</Text>
        <TextInput placeholder="••••••••" placeholderTextColor="#8B98AC" secureTextEntry style={styles.input} />
      </SectionCard>

      <PrimaryButton label="Sign In" onPress={() => navigation.replace('MainTabs')} />
      <PrimaryButton label="Continue with Google" variant="secondary" onPress={() => {}} />
      <PrimaryButton label="Forgot password?" variant="ghost" onPress={() => navigation.navigate('ForgotPasswordScreen')} />
      <PrimaryButton label="Create account" variant="ghost" onPress={() => navigation.navigate('SignUpScreen')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  brandTile: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#DEF7FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  brandIcon: {
    fontSize: 34,
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
});