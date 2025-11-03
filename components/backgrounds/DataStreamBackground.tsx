import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreamLineProps {
  delay: number;
  height: number;
  color: string;
  position: 'left' | 'right';
  speed: number;
}

function StreamLine({ delay, height, color, position, speed }: StreamLineProps) {
  const translateY = useSharedValue(-height);
  const opacity = useSharedValue(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const duration = speed;

    translateY.value = withRepeat(
      withTiming(SCREEN_HEIGHT, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    opacity.value = withRepeat(
      withTiming(1, {
        duration: duration / 4,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      false
    );
  }, [prefersReducedMotion, speed, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(
      translateY.value,
      [-height, 0, SCREEN_HEIGHT / 2, SCREEN_HEIGHT],
      [0, 1, 0.6, 0]
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.streamLine,
        {
          height,
          [position]: position === 'left' ? '10%' : '15%',
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[color, 'transparent']}
        style={styles.streamGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </Animated.View>
  );
}

export function DataStreamBackground() {
  const prefersReducedMotion = useReducedMotion();

  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const ambientGlow = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    pulse1.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    pulse2.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    ambientGlow.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [prefersReducedMotion]);

  const pulse1Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse1.value, [0, 1], [0.15, 0.35]),
    transform: [
      { scale: interpolate(pulse1.value, [0, 1], [1, 1.1]) },
    ],
  }));

  const pulse2Style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse2.value, [0, 1], [0.1, 0.3]),
    transform: [
      { scale: interpolate(pulse2.value, [0, 1], [1, 1.15]) },
    ],
  }));

  const ambientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ambientGlow.value, [0, 1], [0.3, 0.5]),
  }));

  const streams = [
    { delay: 0, height: 150, color: 'rgba(59, 130, 246, 0.4)', position: 'left' as const, speed: 8000 },
    { delay: 1000, height: 200, color: 'rgba(16, 185, 129, 0.35)', position: 'right' as const, speed: 10000 },
    { delay: 2000, height: 120, color: 'rgba(139, 92, 246, 0.4)', position: 'left' as const, speed: 7000 },
    { delay: 3000, height: 180, color: 'rgba(6, 182, 212, 0.3)', position: 'right' as const, speed: 9000 },
    { delay: 1500, height: 160, color: 'rgba(99, 102, 241, 0.35)', position: 'left' as const, speed: 8500 },
  ];

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
        colors={['#050810', '#0a0e1a', '#0d1220', '#0f1729']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <Animated.View style={[styles.ambientLight, ambientStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(59, 130, 246, 0.08)',
            'rgba(139, 92, 246, 0.08)',
            'transparent',
          ]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.pulseOrb, styles.pulseOrb1, pulse1Style]}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.25)', 'rgba(59, 130, 246, 0)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.pulseOrb, styles.pulseOrb2, pulse2Style]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0)', 'transparent']}
          style={styles.orbGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {streams.map((stream, index) => (
        <StreamLine key={index} {...stream} />
      ))}

      <View style={styles.topVignette} />
      <View style={styles.bottomVignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050810',
    overflow: 'hidden',
  },
  streamLine: {
    position: 'absolute',
    width: 2,
    top: 0,
  },
  streamGradient: {
    width: '100%',
    height: '100%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  ambientLight: {
    ...StyleSheet.absoluteFillObject,
  },
  pulseOrb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  pulseOrb1: {
    width: 600,
    height: 600,
    top: -250,
    right: -200,
  },
  pulseOrb2: {
    width: 500,
    height: 500,
    bottom: -200,
    left: -150,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 50 },
    shadowOpacity: 0.9,
    shadowRadius: 50,
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -50 },
    shadowOpacity: 0.9,
    shadowRadius: 50,
  },
});
