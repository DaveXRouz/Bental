import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/theme';
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
    borderRadius: theme.radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.stroke,
    ...theme.shadows.md,
  },
  blur: {
    overflow: 'hidden',
    borderRadius: theme.radii.xl,
  },
  content: {
    padding: theme.spacing(3),
    backgroundColor: 'rgba(11, 13, 16, 0.4)',
  },
});
