import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'LockScreen'>;

export function LockScreen({ navigation }: Props): React.JSX.Element {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.lockCard}>
          <Text style={styles.title}>App Locked</Text>
          <Text style={styles.appName}>TikTok is temporarily blocked.</Text>
          <Text style={styles.timer}>Time remaining: 24m 18s</Text>
          <Text style={styles.message}>“Your future is not in the feed.”</Text>
          <Text style={styles.info}>This preview reflects the final lock experience after limits are exceeded.</Text>
        </View>

        <Pressable onPress={() => navigation.navigate('DashboardScreen')} style={styles.button}>
          <Text style={styles.buttonText}>Return to Dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  lockCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 20,
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  appName: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 12,
  },
  timer: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: '#D1D5DB',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  info: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9CA3AF',
  },
  button: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
});