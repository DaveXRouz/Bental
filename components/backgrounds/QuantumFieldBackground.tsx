import { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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
import { Canvas, Path, Skia, BlurMask, Group } from '@shopify/react-native-skia';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function QuantumFieldBackground() {
  const prefersReducedMotion = useReducedMotion();

  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const duration = 20000;

    float1.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    float2.value = withRepeat(
      withTiming(1, { duration: duration * 1.5, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    float3.value = withRepeat(
      withTiming(1, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [prefersReducedMotion]);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float1.value, [0, 1], [0, 100]) },
      { translateY: interpolate(float1.value, [0, 1], [0, -80]) },
      { scale: interpolate(float1.value, [0, 0.5, 1], [1, 1.2, 1]) },
    ],
    opacity: interpolate(glow.value, [0, 1], [0.15, 0.35]),
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float2.value, [0, 1], [0, -120]) },
      { translateY: interpolate(float2.value, [0, 1], [0, 60]) },
      { scale: interpolate(float2.value, [0, 0.5, 1], [1, 0.9, 1]) },
    ],
    opacity: interpolate(glow.value, [0, 1], [0.1, 0.3]),
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(float3.value, [0, 1], [0, 80]) },
      { translateY: interpolate(float3.value, [0, 1], [0, 100]) },
      { scale: interpolate(float3.value, [0, 0.5, 1], [1, 1.15, 1]) },
    ],
    opacity: interpolate(glow.value, [0, 1], [0.12, 0.28]),
  }));

  if (prefersReducedMotion) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a0e1a', '#0f1729', '#1a1f35']}
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
        colors={['#0a0e1a', '#0f1729', '#1a1f35', '#0f1729']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.orb, styles.orb1, orb1Style]}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.3)', 'rgba(147, 51, 234, 0.2)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, styles.orb2, orb2Style]}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.25)', 'rgba(6, 182, 212, 0.2)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.orb, styles.orb3, orb3Style]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'rgba(59, 130, 246, 0.15)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.gridOverlay}>
        <GridPattern />
      </View>

      <View style={styles.noiseOverlay} />
    </View>
  );
}

function GridPattern() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: `${(i + 1) * 12.5}%` }]} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: `${(i + 1) * 8.33}%` }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0e1a',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 600,
    height: 600,
    top: -200,
    right: -150,
  },
  orb2: {
    width: 500,
    height: 500,
    bottom: -150,
    left: -100,
  },
  orb3: {
    width: 400,
    height: 400,
    top: '40%',
    right: -100,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  grid: {
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  horizontalLine: {
    height: 1,
    width: '100%',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.015,
    backgroundColor: 'transparent',
  },
});
