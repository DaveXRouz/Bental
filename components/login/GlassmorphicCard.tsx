import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '@/constants/theme';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassmorphicCard({ children, style }: GlassmorphicCardProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(400)}
      style={[styles.container, style]}
    >
      <BlurView intensity={50} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={[
            'rgba(26, 26, 28, 0.85)',
            'rgba(20, 20, 22, 0.90)',
            'rgba(16, 16, 18, 0.92)'
          ]}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.content}>{children}</View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 12,
  },
  blur: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: spacing.lg + 4,
    paddingVertical: spacing.lg + 4,
  },
});
