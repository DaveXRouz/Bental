import { useEffect } from 'react';
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
import Svg, { Defs, RadialGradient, Stop, Polygon, G, Path } from 'react-native-svg';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

interface HexProps {
  x: number;
  y: number;
  size: number;
  delay: number;
}

function AnimatedHex({ x, y, size, delay }: HexProps) {
  const opacity = useSharedValue(0.1);
  const scale = useSharedValue(1);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;

    opacity.value = withRepeat(
      withSequence(
        withTiming(0.1, { duration: 0 }),
        withTiming(0.4, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.05, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );
  }, [prefersReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const points = getHexagonPoints(x, y, size);

  return (
    <AnimatedPolygon
      points={points}
      fill="none"
      stroke="rgba(255, 255, 255, 0.15)"
      strokeWidth="1"
      style={animatedStyle}
    />
  );
}

function getHexagonPoints(cx: number, cy: number, size: number): string {
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push([x, y]);
  }
  return points.map((p) => `${p[0]},${p[1]}`).join(' ');
}

export function HexagonalFlowBackground() {
  const prefersReducedMotion = useReducedMotion();

  const glow1 = useSharedValue(0);
  const glow2 = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    glow1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    glow2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );
  }, [prefersReducedMotion]);

  const glow1Style = useAnimatedStyle(() => ({
    opacity: interpolate(glow1.value, [0, 1], [0.1, 0.3]),
    transform: [
      { scale: interpolate(glow1.value, [0, 1], [1, 1.1]) },
    ],
  }));

  const glow2Style = useAnimatedStyle(() => ({
    opacity: interpolate(glow2.value, [0, 1], [0.08, 0.25]),
    transform: [
      { scale: interpolate(glow2.value, [0, 1], [1, 1.15]) },
    ],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const hexSize = 40;
  const hexSpacingX = hexSize * 1.75;
  const hexSpacingY = hexSize * 1.5;
  const cols = Math.ceil(SCREEN_WIDTH / hexSpacingX) + 2;
  const rows = Math.ceil(SCREEN_HEIGHT / hexSpacingY) + 2;

  const hexagons: HexProps[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexSpacingX + (row % 2) * (hexSpacingX / 2);
      const y = row * hexSpacingY;
      const delay = (row + col) * 100;
      hexagons.push({ x, y, size: hexSize, delay });
    }
  }

  if (prefersReducedMotion) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#050505', '#0a0a0a']}
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
        colors={['#000000', '#050505', '#0a0a0a', '#101010']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <Animated.View style={[styles.glow, styles.glow1, glow1Style]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.05)', 'transparent']}
          style={styles.glowGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.glow, styles.glow2, glow2Style]}>
        <LinearGradient
          colors={['transparent', 'rgba(240, 240, 240, 0.04)', 'transparent']}
          style={styles.glowGradient}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      <Animated.View style={[styles.hexContainer, rotateStyle]}>
        <Svg width={SCREEN_WIDTH * 2} height={SCREEN_HEIGHT * 2} style={styles.svg}>
          <Defs>
            <RadialGradient id="hexGlow" cx="50%" cy="50%">
              <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" stopOpacity="1" />
              <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <G>
            {hexagons.map((hex, i) => (
              <AnimatedHex key={i} {...hex} />
            ))}
          </G>
        </Svg>
      </Animated.View>

      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  hexContainer: {
    position: 'absolute',
    top: -SCREEN_HEIGHT / 2,
    left: -SCREEN_WIDTH / 2,
    opacity: 0.4,
  },
  svg: {
    opacity: 0.6,
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  glow1: {
    width: 500,
    height: 500,
    top: -100,
    right: -150,
  },
  glow2: {
    width: 600,
    height: 600,
    bottom: -200,
    left: -200,
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
  },
});
