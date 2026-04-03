import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../Screen';
import { colors, spacing, typography } from '../../theme/tokens';

type AppScreenProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  noScroll?: boolean;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
};

export function AppScreen({ title, subtitle, children, noScroll, headerLeft, headerRight }: AppScreenProps): React.JSX.Element {
  const content = (
    <View style={[styles.pageWrap, noScroll && styles.flexContent]}>
      <View style={[styles.content, noScroll && styles.flexContent]}>
        {(headerLeft || headerRight) && (
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>{headerLeft}</View>
            <View style={styles.headerRight}>{headerRight}</View>
          </View>
        )}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );

  return (
    <Screen style={styles.safeArea}>
      {noScroll ? content : <ScrollView contentContainerStyle={styles.scrollContainer}>{content}</ScrollView>}
    </Screen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  pageWrap: {
    width: '100%',
    alignItems: 'center',
  },
  flexContent: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0B1330',
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#4D5F78',
    lineHeight: 24,
    marginTop: -2,
    marginBottom: spacing.xs,
  },
});