import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(180).delay(100)}
      style={[styles.container, style]}
    >
      <BlurView intensity={40} tint="dark" style={styles.blur}>
        <View style={styles.content}>{children}</View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  blur: {
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
  content: {
    padding: spacing.md,
    backgroundColor: 'rgba(11, 13, 16, 0.4)',
  },
});
