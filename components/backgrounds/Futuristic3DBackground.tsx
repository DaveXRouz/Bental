import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width, height } = Dimensions.get('window');

interface FloatingShape {
  id: number;
  type: 'x' | 'cube' | 'sphere' | 'pyramid';
  size: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
}

const shapes: FloatingShape[] = [
  { id: 1, type: 'x', size: 120, startX: width * 0.1, startY: height * 0.15, duration: 8000, delay: 0 },
  { id: 2, type: 'cube', size: 90, startX: width * 0.8, startY: height * 0.25, duration: 10000, delay: 500 },
  { id: 3, type: 'sphere', size: 100, startX: width * 0.15, startY: height * 0.65, duration: 9000, delay: 1000 },
  { id: 4, type: 'x', size: 80, startX: width * 0.85, startY: height * 0.7, duration: 11000, delay: 1500 },
  { id: 5, type: 'pyramid', size: 70, startX: width * 0.5, startY: height * 0.1, duration: 12000, delay: 2000 },
  { id: 6, type: 'cube', size: 60, startX: width * 0.3, startY: height * 0.85, duration: 9500, delay: 2500 },
  { id: 7, type: 'x', size: 110, startX: width * 0.9, startY: height * 0.5, duration: 10500, delay: 3000 },
  { id: 8, type: 'sphere', size: 85, startX: width * 0.05, startY: height * 0.4, duration: 11500, delay: 3500 },
];

function FloatingXShape({ size, startX, startY, duration, delay, reduceMotion }: FloatingShape & { reduceMotion: boolean }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) return;

    translateY.value = withRepeat(
      withSequence(
        withTiming(-30, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(30, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    translateX.value = withRepeat(
      withSequence(
        withTiming(20, { duration: duration / 3, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(-20, { duration: duration / 3, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(0, { duration: duration / 3, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: duration * 2, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withSpring(1.15, { damping: 15, stiffness: 100 }),
        withSpring(0.95, { damping: 15, stiffness: 100 }),
        withSpring(1, { damping: 15, stiffness: 100 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: duration / 2 }),
        withTiming(0.2, { duration: duration / 2 })
      ),
      -1,
      true
    );
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
      { perspective: 1000 },
    ],
    opacity: opacity.value,
  }));

  const strokeWidth = size * 0.15;

  return (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={['rgba(96, 255, 218, 0.4)', 'rgba(120, 220, 255, 0.3)', 'rgba(200, 160, 255, 0.2)']}
        style={[styles.xStroke, {
          width: strokeWidth,
          height: size * 0.8,
          left: size * 0.2,
          top: size * 0.1,
          transform: [{ rotate: '45deg' }],
        }]}
      />
      <LinearGradient
        colors={['rgba(200, 160, 255, 0.4)', 'rgba(120, 220, 255, 0.3)', 'rgba(96, 255, 218, 0.2)']}
        style={[styles.xStroke, {
          width: strokeWidth,
          height: size * 0.8,
          right: size * 0.2,
          top: size * 0.1,
          transform: [{ rotate: '-45deg' }],
        }]}
      />
    </Animated.View>
  );
}

function FloatingCube({ size, startX, startY, duration, delay, reduceMotion }: FloatingShape & { reduceMotion: boolean }) {
  const translateY = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.25);

  useEffect(() => {
    if (reduceMotion) return;

    translateY.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(40, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    rotateX.value = withRepeat(
      withTiming(360, { duration: duration * 1.5, easing: Easing.linear }),
      -1,
      false
    );

    rotateY.value = withRepeat(
      withTiming(360, { duration: duration * 2, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 12, stiffness: 80 }),
        withSpring(0.9, { damping: 12, stiffness: 80 })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: duration / 2 }),
        withTiming(0.2, { duration: duration / 2 })
      ),
      -1,
      true
    );
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { translateY: translateY.value },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={['rgba(64, 224, 208, 0.35)', 'rgba(100, 180, 255, 0.25)']}
        style={[styles.cubeShape, { width: size, height: size }]}
      />
    </Animated.View>
  );
}

function FloatingSphere({ size, startX, startY, duration, delay, reduceMotion }: FloatingShape & { reduceMotion: boolean }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    if (reduceMotion) return;

    translateY.value = withRepeat(
      withSequence(
        withTiming(-50, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(50, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    translateX.value = withRepeat(
      withSequence(
        withTiming(30, { duration: duration / 2.5, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(-30, { duration: duration / 2.5, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withSpring(1.25, { damping: 10, stiffness: 60 }),
        withSpring(0.85, { damping: 10, stiffness: 60 })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.45, { duration: duration / 2 }),
        withTiming(0.25, { duration: duration / 2 })
      ),
      -1,
      true
    );
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={['rgba(138, 43, 226, 0.35)', 'rgba(75, 0, 130, 0.25)', 'rgba(147, 112, 219, 0.3)']}
        style={[styles.sphereShape, { width: size, height: size, borderRadius: size / 2 }]}
      />
    </Animated.View>
  );
}

function FloatingPyramid({ size, startX, startY, duration, delay, reduceMotion }: FloatingShape & { reduceMotion: boolean }) {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.28);

  useEffect(() => {
    if (reduceMotion) return;

    translateY.value = withRepeat(
      withSequence(
        withTiming(-35, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(35, { duration: duration / 2, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: duration * 1.8, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withSpring(1.18, { damping: 14, stiffness: 90 }),
        withSpring(0.92, { damping: 14, stiffness: 90 })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.42, { duration: duration / 2 }),
        withTiming(0.22, { duration: duration / 2 })
      ),
      -1,
      true
    );
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
      { perspective: 800 },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={['rgba(255, 140, 0, 0.35)', 'rgba(255, 215, 0, 0.25)', 'rgba(255, 165, 0, 0.3)']}
        style={[styles.pyramidShape, {
          width: size,
          height: size,
          borderLeftWidth: size / 2,
          borderRightWidth: size / 2,
          borderBottomWidth: size,
        }]}
      />
    </Animated.View>
  );
}

export function Futuristic3DBackground() {
  const prefersReducedMotion = useReducedMotion();

  const ambientGlow1 = useSharedValue(0);
  const ambientGlow2 = useSharedValue(0);
  const fogOpacity = useSharedValue(0.05);

  useEffect(() => {
    if (prefersReducedMotion) return;

    ambientGlow1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(0, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    ambientGlow2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 5000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
        withTiming(0, { duration: 5000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
      ),
      -1,
      false
    );

    fogOpacity.value = withRepeat(
      withSequence(
        withTiming(0.08, { duration: 6000 }),
        withTiming(0.05, { duration: 6000 })
      ),
      -1,
      true
    );
  }, [prefersReducedMotion]);

  const glow1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ambientGlow1.value, [0, 1], [0.15, 0.35]),
    transform: [
      { scale: interpolate(ambientGlow1.value, [0, 1], [1, 1.3]) },
    ],
  }));

  const glow2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ambientGlow2.value, [0, 1], [0.2, 0.4]),
    transform: [
      { scale: interpolate(ambientGlow2.value, [0, 1], [1, 1.4]) },
    ],
  }));

  const fogStyle = useAnimatedStyle(() => ({
    opacity: fogOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0514', '#050208', '#000000']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.ambientGlow, styles.glow1, glow1Style]}>
        <LinearGradient
          colors={['rgba(96, 255, 218, 0.3)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.ambientGlow, styles.glow2, glow2Style]}>
        <LinearGradient
          colors={['rgba(200, 160, 255, 0.3)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {shapes.map((shape) => {
        const ShapeComponent =
          shape.type === 'x' ? FloatingXShape :
          shape.type === 'cube' ? FloatingCube :
          shape.type === 'sphere' ? FloatingSphere :
          FloatingPyramid;

        return (
          <ShapeComponent
            key={shape.id}
            {...shape}
            reduceMotion={prefersReducedMotion}
          />
        );
      })}

      <Animated.View style={[styles.fogOverlay, fogStyle]} />

      <View style={styles.grainOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  glow1: {
    top: -100,
    left: -100,
  },
  glow2: {
    bottom: -150,
    right: -150,
  },
  floatingShape: {
    position: 'absolute',
  },
  xStroke: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: 'rgba(96, 255, 218, 0.6)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  cubeShape: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(96, 255, 218, 0.3)',
    shadowColor: 'rgba(64, 224, 208, 0.6)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 8,
  },
  sphereShape: {
    borderWidth: 1,
    borderColor: 'rgba(200, 160, 255, 0.3)',
    shadowColor: 'rgba(138, 43, 226, 0.6)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 8,
  },
  pyramidShape: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 165, 0, 0.35)',
    shadowColor: 'rgba(255, 140, 0, 0.6)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 8,
  },
  fogOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(120, 220, 255, 0.03)',
  },
  grainOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.035,
    backgroundColor: 'transparent',
  },
});
