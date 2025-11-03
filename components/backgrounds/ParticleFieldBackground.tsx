import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  useFrameCallback,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLE_COUNT = 50;
const CONNECTION_DISTANCE = 120;

interface Particle {
  id: number;
  x: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function ParticleFieldBackground() {
  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);

  const wavePhase = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    wavePhase.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: 15000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const colors = [
      'rgba(59, 130, 246, 0.6)',   // Blue
      'rgba(16, 185, 129, 0.5)',   // Green
      'rgba(139, 92, 246, 0.6)',   // Purple
      'rgba(6, 182, 212, 0.5)',    // Cyan
    ];

    const newParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: useSharedValue(Math.random() * SCREEN_WIDTH),
      y: useSharedValue(Math.random() * SCREEN_HEIGHT),
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    setParticles(newParticles);
  }, [prefersReducedMotion]);

  useFrameCallback((frameInfo) => {
    if (prefersReducedMotion) return;

    particles.forEach((particle) => {
      let newX = particle.x.value + particle.vx;
      let newY = particle.y.value + particle.vy;

      if (newX < 0 || newX > SCREEN_WIDTH) {
        particle.vx *= -1;
        newX = Math.max(0, Math.min(SCREEN_WIDTH, newX));
      }

      if (newY < 0 || newY > SCREEN_HEIGHT) {
        particle.vy *= -1;
        newY = Math.max(0, Math.min(SCREEN_HEIGHT, newY));
      }

      particle.x.value = newX;
      particle.y.value = newY;
    });
  });

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
        colors={['#060913', '#0a0e1a', '#0f1729', '#1a1f35']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <WaveLayer phase={wavePhase} />

      <View style={styles.particleContainer}>
        {particles.map((particle) => (
          <AnimatedParticle key={particle.id} particle={particle} />
        ))}
      </View>

      <View style={styles.scanlineOverlay} />
    </View>
  );
}

function AnimatedParticle({ particle }: { particle: Particle }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: particle.x.value },
      { translateY: particle.y.value },
    ],
    opacity: particle.opacity,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
        },
        animatedStyle,
      ]}
    />
  );
}

function WaveLayer({ phase }: { phase: Animated.SharedValue<number> }) {
  const wave1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(Math.sin(phase.value), [-1, 1], [-20, 20]) },
    ],
    opacity: 0.05,
  }));

  const wave2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(Math.sin(phase.value + Math.PI / 2), [-1, 1], [-30, 30]) },
    ],
    opacity: 0.03,
  }));

  return (
    <>
      <Animated.View style={[styles.wave, wave1Style]}>
        <LinearGradient
          colors={['transparent', 'rgba(59, 130, 246, 0.15)', 'transparent']}
          style={styles.waveGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>

      <Animated.View style={[styles.wave, { top: '60%' }, wave2Style]}>
        <LinearGradient
          colors={['transparent', 'rgba(139, 92, 246, 0.12)', 'transparent']}
          style={styles.waveGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060913',
    overflow: 'hidden',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    borderRadius: 9999,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  wave: {
    position: 'absolute',
    width: '100%',
    height: 200,
    top: '30%',
  },
  waveGradient: {
    width: '100%',
    height: '100%',
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    backgroundColor: 'transparent',
  },
});
