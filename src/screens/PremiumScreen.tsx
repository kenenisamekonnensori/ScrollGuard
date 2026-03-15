import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/ui/AppScreen';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { SectionCard } from '../components/ui/SectionCard';
import { colors } from '../theme/tokens';

export function PremiumScreen(): React.JSX.Element {
  return (
    <AppScreen
      title="Premium Subscription"
      subtitle="Unlock deeper insights, flexible extension controls, and advanced focus protection.">
      <View style={styles.topBadgeWrap}>
        <Text style={styles.topBadge}>UNLEASH YOUR PRODUCTIVITY</Text>
      </View>

      <SectionCard title="Premium Includes">
        <Text style={styles.item}>• Extended lock overrides with smart limits</Text>
        <Text style={styles.item}>• Advanced analytics and trigger trends</Text>
        <Text style={styles.item}>• Focus schedules and automation</Text>
        <Text style={styles.item}>• Cloud backup and account sync (coming soon)</Text>
      </SectionCard>

      <SectionCard title="Plans">
        <View style={styles.planCardFeatured}>
          <Text style={styles.planLabel}>Most Popular</Text>
          <Text style={styles.price}>$4.99 / month</Text>
          <Text style={styles.caption}>Or $39.99/year (save 33%)</Text>
        </View>
        <Text style={styles.priceMuted}>Free Plan — $0 forever</Text>
      </SectionCard>

      <PrimaryButton label="Start 7-Day Free Trial" onPress={() => {}} />
      <PrimaryButton label="Restore Purchases" variant="secondary" onPress={() => {}} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topBadgeWrap: {
    alignItems: 'center',
  },
  topBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#7E22CE',
    backgroundColor: '#F3E8FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  item: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  planCardFeatured: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#EBF9FD',
    gap: 4,
  },
  planLabel: {
    alignSelf: 'flex-start',
    fontSize: 10,
    color: colors.white,
    backgroundColor: '#8B5CF6',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  caption: {
    color: colors.textMuted,
    fontSize: 12,
  },
  priceMuted: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
});