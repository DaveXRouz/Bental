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
    maxWidth: 380,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    overflow: 'hidden',
    borderRadius: radius.lg,
  },
  content: {
    padding: spacing.md * 2,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
  },
});
