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

export function ParallaxBackground() {
  const prefersReducedMotion = useReducedMotion();

  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    wave1.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    wave2.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    wave3.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    float1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    float2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [prefersReducedMotion]);

  const wave1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(wave1.value, [0, 1], [0, -30]) },
    ],
    opacity: interpolate(wave1.value, [0, 0.5, 1], [0.3, 0.5, 0.3]),
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(wave2.value, [0, 1], [0, 40]) },
    ],
    opacity: interpolate(wave2.value, [0, 0.5, 1], [0.4, 0.6, 0.4]),
  }));

  const wave3Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(wave3.value, [0, 1], [0, -50]) },
    ],
    opacity: interpolate(wave3.value, [0, 0.5, 1], [0.2, 0.4, 0.2]),
  }));

  const float1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float1.value, [0, 1], [0, -20]) },
      { scale: interpolate(float1.value, [0, 0.5, 1], [1, 1.05, 1]) },
    ],
    opacity: interpolate(float1.value, [0, 1], [0.15, 0.3]),
  }));

  const float2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(float2.value, [0, 1], [0, 25]) },
      { scale: interpolate(float2.value, [0, 0.5, 1], [1, 1.08, 1]) },
    ],
    opacity: interpolate(float2.value, [0, 1], [0.2, 0.35]),
  }));

  if (prefersReducedMotion) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#0a0a0a', '#050505']}
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
        colors={['#000000', '#0a0a0a', '#141414', '#0a0a0a', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.wave, styles.wave1, wave1Style]}>
        <LinearGradient
          colors={['rgba(80, 80, 80, 0.15)', 'transparent']}
          style={styles.waveGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.wave, styles.wave2, wave2Style]}>
        <LinearGradient
          colors={['rgba(100, 100, 100, 0.12)', 'transparent']}
          style={styles.waveGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.wave, styles.wave3, wave3Style]}>
        <LinearGradient
          colors={['rgba(60, 60, 60, 0.18)', 'transparent']}
          style={styles.waveGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.floatingShape, styles.float1, float1Style]}>
        <View style={styles.shape1} />
      </Animated.View>

      <Animated.View style={[styles.floatingShape, styles.float2, float2Style]}>
        <View style={styles.shape2} />
      </Animated.View>

      <View style={styles.gridOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  wave1: {
    top: '10%',
  },
  wave2: {
    bottom: '15%',
  },
  wave3: {
    top: '40%',
  },
  waveGradient: {
    width: '100%',
    height: '100%',
  },
  floatingShape: {
    position: 'absolute',
  },
  float1: {
    top: '20%',
    right: '10%',
  },
  float2: {
    bottom: '25%',
    left: '8%',
  },
  shape1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  shape2: {
    width: 150,
    height: 150,
    borderRadius: 20,
    backgroundColor: 'rgba(100, 100, 100, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    transform: [{ rotate: '45deg' }],
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.02,
  },
});
