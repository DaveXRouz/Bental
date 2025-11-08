import { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Platform, ScaledSize } from 'react-native';
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

interface FloatingShape {
  id: number;
  type: 'x' | 'cube' | 'sphere' | 'pyramid';
  size: number;
  startX: number;
  startY: number;
  duration: number;
  delay: number;
}

interface DeviceProfile {
  name: string;
  shapeCount: number;
  shapeScale: number;
  animationSpeed: number;
  glowIntensity: number;
  useNativeDriver: boolean;
}

// Device detection and profiling
function getDeviceProfile(dimensions: ScaledSize): DeviceProfile {
  const { width, height } = dimensions;
  const aspectRatio = width / height;
  const isLandscape = width > height;
  const screenSize = width * height;

  // Phone Portrait (< 768px width)
  if (width < 768 && !isLandscape) {
    return {
      name: 'phone-portrait',
      shapeCount: 4,
      shapeScale: 0.8,
      animationSpeed: 1.2, // Slightly faster
      glowIntensity: 0.7,
      useNativeDriver: true,
    };
  }

  // Phone Landscape
  if (width < 768 && isLandscape) {
    return {
      name: 'phone-landscape',
      shapeCount: 5,
      shapeScale: 0.7,
      animationSpeed: 1.1,
      glowIntensity: 0.8,
      useNativeDriver: true,
    };
  }

  // Tablet Portrait (768px - 1024px)
  if (width >= 768 && width < 1024 && !isLandscape) {
    return {
      name: 'tablet-portrait',
      shapeCount: 6,
      shapeScale: 0.9,
      animationSpeed: 1.0,
      glowIntensity: 0.85,
      useNativeDriver: true,
    };
  }

  // Tablet Landscape
  if (width >= 768 && width < 1024 && isLandscape) {
    return {
      name: 'tablet-landscape',
      shapeCount: 7,
      shapeScale: 1.0,
      animationSpeed: 1.0,
      glowIntensity: 0.9,
      useNativeDriver: true,
    };
  }

  // Desktop / Large screens (>= 1024px)
  if (Platform.OS === 'web') {
    return {
      name: 'desktop-web',
      shapeCount: 5, // Fewer for web performance
      shapeScale: 1.0,
      animationSpeed: 0.9, // Slightly slower for elegance
      glowIntensity: 0.8,
      useNativeDriver: false, // Web doesn't fully support native driver
    };
  }

  // Desktop Native (iPad Pro, etc.)
  return {
    name: 'desktop-native',
    shapeCount: 8,
    shapeScale: 1.1,
    animationSpeed: 0.95,
    glowIntensity: 1.0,
    useNativeDriver: true,
  };
}

// Generate responsive shape configurations
function generateShapes(profile: DeviceProfile, dimensions: ScaledSize): FloatingShape[] {
  const { width, height } = dimensions;
  const { shapeCount, shapeScale } = profile;

  const baseShapes: Omit<FloatingShape, 'startX' | 'startY' | 'size'>[] = [
    { id: 1, type: 'x', duration: 8000, delay: 0 },
    { id: 2, type: 'cube', duration: 10000, delay: 500 },
    { id: 3, type: 'sphere', duration: 9000, delay: 1000 },
    { id: 4, type: 'x', duration: 11000, delay: 1500 },
    { id: 5, type: 'pyramid', duration: 12000, delay: 2000 },
    { id: 6, type: 'cube', duration: 9500, delay: 2500 },
    { id: 7, type: 'sphere', duration: 10500, delay: 3000 },
    { id: 8, type: 'pyramid', duration: 11500, delay: 3500 },
  ];

  // Safe zones to avoid (content areas)
  const safeZones = {
    top: height * 0.1,
    bottom: height * 0.9,
    left: width * 0.1,
    right: width * 0.9,
  };

  return baseShapes.slice(0, shapeCount).map((shape, index) => {
    // Distribute shapes evenly across the screen
    const section = index / shapeCount;
    const xVariance = Math.random() * 0.15 - 0.075; // ±7.5%
    const yVariance = Math.random() * 0.15 - 0.075;

    let startX = width * (0.1 + section * 0.8 + xVariance);
    let startY = height * (0.15 + section * 0.7 + yVariance);

    // Ensure shapes stay within safe bounds
    startX = Math.max(safeZones.left, Math.min(safeZones.right, startX));
    startY = Math.max(safeZones.top, Math.min(safeZones.bottom, startY));

    // Size based on shape type and scale
    const baseSizes = { x: 120, cube: 90, sphere: 100, pyramid: 70 };
    const size = baseSizes[shape.type] * shapeScale;

    return {
      ...shape,
      startX,
      startY,
      size: Math.floor(size),
    };
  });
}

interface AnimatedShapeProps extends FloatingShape {
  reduceMotion: boolean;
  animationSpeed: number;
}

function AnimatedShape({
  id,
  type,
  size,
  startX,
  startY,
  duration,
  delay,
  reduceMotion,
  animationSpeed
}: AnimatedShapeProps) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  const adjustedDuration = duration / animationSpeed;

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.2;
      return;
    }

    const movement = size * 0.3; // Movement relative to size

    translateY.value = withRepeat(
      withSequence(
        withTiming(-movement, {
          duration: adjustedDuration / 2,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95)
        }),
        withTiming(movement, {
          duration: adjustedDuration / 2,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95)
        })
      ),
      -1,
      false
    );

    translateX.value = withRepeat(
      withSequence(
        withTiming(movement * 0.7, {
          duration: adjustedDuration / 3,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95)
        }),
        withTiming(-movement * 0.7, {
          duration: adjustedDuration / 3,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95)
        }),
        withTiming(0, {
          duration: adjustedDuration / 3,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95)
        })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: adjustedDuration * 2, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withSpring(1.2, { damping: 18, stiffness: 90 }),
        withSpring(0.9, { damping: 18, stiffness: 90 }),
        withSpring(1, { damping: 18, stiffness: 90 })
      ),
      -1,
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: adjustedDuration / 2 }),
        withTiming(0.25, { duration: adjustedDuration / 2 })
      ),
      -1,
      true
    );
  }, [reduceMotion, animationSpeed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shapeColors = {
    x: ['rgba(180, 180, 190, 0.25)', 'rgba(160, 160, 170, 0.2)'] as const,
    cube: ['rgba(170, 170, 180, 0.22)', 'rgba(150, 150, 160, 0.18)'] as const,
    sphere: ['rgba(160, 160, 170, 0.2)', 'rgba(130, 130, 140, 0.15)'] as const,
    pyramid: ['rgba(170, 170, 180, 0.2)', 'rgba(150, 150, 160, 0.15)'] as const,
  };

  const getShapeComponent = () => {
    const colors = shapeColors[type];

    switch (type) {
      case 'x':
        return (
          <View style={[styles.xShape, { width: size, height: size }]}>
            <View style={[styles.xBar, { width: size, height: size * 0.15 }]} />
            <View style={[styles.xBar, { width: size, height: size * 0.15 }]} />
          </View>
        );
      case 'cube':
        return (
          <LinearGradient
            colors={colors}
            style={[styles.cubeShape, { width: size, height: size, borderRadius: size * 0.15 }]}
          />
        );
      case 'sphere':
        return (
          <LinearGradient
            colors={colors}
            style={[styles.sphereShape, { width: size, height: size, borderRadius: size / 2 }]}
          />
        );
      case 'pyramid':
        return (
          <View
            style={[
              styles.pyramidShape,
              {
                borderLeftWidth: size / 2,
                borderRightWidth: size / 2,
                borderBottomWidth: size,
                borderBottomColor: 'rgba(170, 170, 180, 0.22)',
              },
            ]}
          />
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.floatingShape,
        {
          left: startX - size / 2,
          top: startY - size / 2,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      {getShapeComponent()}
    </Animated.View>
  );
}

export function ResponsiveAnimatedBackground() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const profile = useMemo(() => getDeviceProfile(dimensions), [dimensions]);
  const shapes = useMemo(() => generateShapes(profile, dimensions), [profile, dimensions]);

  // Ambient glow animations
  const ambientGlow1 = useSharedValue(0);
  const ambientGlow2 = useSharedValue(0);
  const ambientGlow3 = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const glowDuration = 5000 / profile.animationSpeed;

    ambientGlow1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: glowDuration, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) }),
        withTiming(0, { duration: glowDuration, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) })
      ),
      -1,
      false
    );

    ambientGlow2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: glowDuration * 1.2, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) }),
        withTiming(0, { duration: glowDuration * 1.2, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) })
      ),
      -1,
      false
    );

    ambientGlow3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: glowDuration * 1.4, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) }),
        withTiming(0, { duration: glowDuration * 1.4, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) })
      ),
      -1,
      false
    );
  }, [prefersReducedMotion, profile.animationSpeed]);

  const glow1Style = useAnimatedStyle(() => ({
    opacity: interpolate(ambientGlow1.value, [0, 1], [0.15, 0.35]) * profile.glowIntensity,
    transform: [{ scale: interpolate(ambientGlow1.value, [0, 1], [1, 1.3]) }],
  }));

  const glow2Style = useAnimatedStyle(() => ({
    opacity: interpolate(ambientGlow2.value, [0, 1], [0.12, 0.3]) * profile.glowIntensity,
    transform: [{ scale: interpolate(ambientGlow2.value, [0, 1], [1, 1.35]) }],
  }));

  const glow3Style = useAnimatedStyle(() => ({
    opacity: interpolate(ambientGlow3.value, [0, 1], [0.1, 0.28]) * profile.glowIntensity,
    transform: [{ scale: interpolate(ambientGlow3.value, [0, 1], [1, 1.25]) }],
  }));

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {/* Base gradient */}
      <LinearGradient
        colors={['#000000', '#0A0A0B', '#050505', '#000000']}
        style={styles.baseGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Ambient glows */}
      <Animated.View style={[styles.ambientGlow, styles.glow1, glow1Style]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.ambientGlow, styles.glow2, glow2Style]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.06)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.ambientGlow, styles.glow3, glow3Style]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Floating shapes */}
      {shapes.map((shape) => (
        <AnimatedShape
          key={shape.id}
          {...shape}
          reduceMotion={prefersReducedMotion}
          animationSpeed={profile.animationSpeed}
        />
      ))}

      {/* Subtle noise overlay */}
      <View style={styles.noiseOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
  glow3: {
    top: '40%',
    left: '30%',
  },
  floatingShape: {
    position: 'absolute',
  },
  xShape: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  xBar: {
    position: 'absolute',
    backgroundColor: 'rgba(180, 180, 190, 0.25)',
    borderRadius: 100,
  },
  cubeShape: {
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 200, 0.2)',
  },
  sphereShape: {
    borderWidth: 1,
    borderColor: 'rgba(180, 180, 180, 0.2)',
  },
  pyramidShape: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    backgroundColor: 'transparent',
  },
});
