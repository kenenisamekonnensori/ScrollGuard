import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StepContentProps } from './types';
import { colors, spacing, typography } from '../../theme/tokens';

const HERO_IMAGE = require('../../../docs/image.jpg');

export function HookScreen({ onNext, onSkip }: StepContentProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screenWrap}>
      <Image source={HERO_IMAGE} resizeMode="cover" style={styles.heroImage} />
      
      <View style={styles.overlay}>
        <View style={[styles.topBar, { marginTop: Math.max(insets.top, 20) }]}>
          <Text style={styles.brand}>ScrollGuard</Text>
          <Pressable onPress={onSkip} hitSlop={10}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.contentWrap}>
          <Text style={styles.title}>Endless scrolling is stealing your time</Text>
          <Text style={styles.body}>
            Short-video apps are designed to keep you addicted. We help you break the cycle.
          </Text>

          <View style={styles.pagination}>
            <View style={styles.activeDot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        <View style={[styles.footerWrap, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable
            onPress={onNext}
            hitSlop={8}
            style={({ pressed }) => [styles.ctaButton, pressed ? styles.pressed : null]}>
            <Text style={styles.ctaLabel}>{'Get Started  ->'}</Text>
          </Pressable>

          <Text style={styles.socialProof}>Join 50,000+ people reclaiming their focus</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.3)', // subtle dark overlay to ensure text legibility
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'auto',
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '700',
  },
  contentWrap: {
    gap: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 40,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  body: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: spacing.md,
  },
  activeDot: {
    width: 42,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#FFF',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  footerWrap: {
    gap: spacing.lg,
  },
  ctaButton: {
    minHeight: 62,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: 10,
  },
  ctaLabel: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  socialProof: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.body,
    marginTop: -4,
    marginBottom: 6,
  },
  pressed: {
    opacity: 0.8,
  },
});
