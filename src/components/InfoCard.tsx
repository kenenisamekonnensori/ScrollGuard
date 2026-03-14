import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type InfoCardProps = {
  title: string;
  children: React.ReactNode;
};

export function InfoCard({ title, children }: InfoCardProps): React.JSX.Element {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  content: {
    gap: 8,
  },
});
