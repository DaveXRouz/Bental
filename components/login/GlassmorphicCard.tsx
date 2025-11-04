import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  SlideInUp,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { radius, spacing } from '@/constants/theme';

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassmorphicCard({ children, style }: GlassmorphicCardProps) {
  const borderAnimation = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    borderAnimation.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(0, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );
  }, []);

  const borderStyle = useAnimatedStyle(() => {
    const rotation = interpolate(borderAnimation.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.4, 0.7]),
  }));

  return (
    <Animated.View
      entering={SlideInUp.duration(600).delay(200).springify().damping(15)}
      style={[styles.container, style]}
    >
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={[
            'rgba(96, 255, 218, 0.15)',
            'rgba(120, 220, 255, 0.12)',
            'rgba(200, 160, 255, 0.1)',
            'rgba(96, 255, 218, 0.15)'
          ]}
          style={styles.glow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.borderAnimationContainer}>
        <Animated.View style={[styles.borderGradientWrapper, borderStyle]}>
          <LinearGradient
            colors={[
              'rgba(96, 255, 218, 0.6)',
              'rgba(120, 220, 255, 0.4)',
              'rgba(200, 160, 255, 0.5)',
              'rgba(96, 255, 218, 0.6)'
            ]}
            style={styles.borderGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      </View>

      <View style={styles.innerBorder}>
        <BlurView intensity={60} tint="dark" style={styles.blur}>
          <LinearGradient
            colors={[
              'rgba(25, 25, 35, 0.85)',
              'rgba(18, 18, 28, 0.90)',
              'rgba(15, 15, 25, 0.92)'
            ]}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          <View style={styles.innerGlow}>
            <LinearGradient
              colors={[
                'rgba(96, 255, 218, 0.08)',
                'transparent',
                'rgba(200, 160, 255, 0.06)'
              ]}
              style={styles.innerGlowGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>

          <View style={styles.content}>{children}</View>
        </BlurView>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.xl,
    position: 'relative',
    shadowColor: 'rgba(96, 255, 218, 0.5)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  glowContainer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: radius.xl + 10,
    zIndex: -1,
  },
  glow: {
    flex: 1,
    borderRadius: radius.xl + 10,
  },
  borderAnimationContainer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: radius.xl + 2,
    overflow: 'hidden',
  },
  borderGradientWrapper: {
    width: '300%',
    height: '300%',
    position: 'absolute',
    top: '-100%',
    left: '-100%',
  },
  borderGradient: {
    flex: 1,
  },
  innerBorder: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  blur: {
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.xl,
  },
  innerGlowGradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + 4,
    paddingBottom: spacing.xl,
  },
});
