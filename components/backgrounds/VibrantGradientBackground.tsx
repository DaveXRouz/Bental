import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function VibrantGradientBackground() {
  const prefersReducedMotion = useReducedMotion();

  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const duration = 15000;

    float1.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    float2.value = withRepeat(
      withTiming(1, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [prefersReducedMotion]);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float1.value, [0, 1], [0, 60]) },
      { translateY: interpolate(float1.value, [0, 1], [0, -40]) },
      { scale: interpolate(float1.value, [0, 0.5, 1], [1, 1.1, 1]) },
    ],
    opacity: interpolate(glow.value, [0, 1], [0.8, 1]),
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float2.value, [0, 1], [0, -50]) },
      { translateY: interpolate(float2.value, [0, 1], [0, 30]) },
      { scale: interpolate(float2.value, [0, 0.5, 1], [1, 0.95, 1]) },
    ],
    opacity: interpolate(glow.value, [0, 1], [0.7, 0.95]),
  }));

  if (prefersReducedMotion) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1e3a8a', '#3b82f6', '#8b5cf6']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1e1b4b', '#312e81', '#1e3a8a', '#3b82f6']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.orb, styles.orb1, orb1Style]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.4)', 'rgba(139, 92, 246, 0.2)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, styles.orb2, orb2Style]}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 0.25)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.overlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 500,
    height: 500,
    top: -150,
    right: -100,
  },
  orb2: {
    width: 600,
    height: 600,
    bottom: -200,
    left: -150,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
