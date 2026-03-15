import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors, radii } from '../theme/tokens';

export function SignUpScreen(): React.JSX.Element {
  const navigation = useNavigation<any>();

  return (
    <AppScreen title="Create Account" subtitle="Start building healthier screen habits today.">
      <View style={styles.heroCard}>
        <Text style={styles.heroIcon}>✨</Text>
        <Text style={styles.heroText}>Join 50,000+ people reclaiming their focus.</Text>
      </View>

      <SectionCard>
        <Text style={styles.label}>Full name</Text>
        <TextInput placeholder="Your name" placeholderTextColor="#8B98AC" style={styles.input} />
        <Text style={styles.label}>Email</Text>
        <TextInput placeholder="you@example.com" placeholderTextColor="#8B98AC" style={styles.input} />
        <Text style={styles.label}>Password</Text>
        <TextInput placeholder="Create password" placeholderTextColor="#8B98AC" secureTextEntry style={styles.input} />
      </SectionCard>

      <PrimaryButton label="Create Account" onPress={() => navigation.replace('MainTabs')} />
      <PrimaryButton label="Continue with Google" variant="secondary" onPress={() => {}} />
      <PrimaryButton label="Already have an account? Sign in" variant="ghost" onPress={() => navigation.navigate('LoginScreen')} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#B6E9F4',
    backgroundColor: '#EAF8FC',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroIcon: {
    fontSize: 20,
  },
  heroText: {
    flex: 1,
    color: '#0E5B6A',
    fontSize: 12,
    fontWeight: '600',
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