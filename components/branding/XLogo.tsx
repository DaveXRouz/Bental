import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';

interface XLogoProps {
  size?: number;
  reduceMotion?: boolean;
}

export function XLogo({ size = 100, reduceMotion = false }: XLogoProps) {
  const glowIntensity = useSharedValue(0.6);
  const rotationY = useSharedValue(0);
  const rotationX = useSharedValue(0);
  const scale = useSharedValue(1);
  const lightPosition = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      glowIntensity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0.6, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );

      rotationY.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(-8, { duration: 6000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );

      rotationX.value = withRepeat(
        withSequence(
          withTiming(-5, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(5, { duration: 8000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );

      scale.value = withRepeat(
        withSequence(
          withSpring(1.08, { damping: 10, stiffness: 80 }),
          withSpring(1, { damping: 10, stiffness: 80 })
        ),
        -1,
        false
      );

      lightPosition.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        -1,
        true
      );
    }
  }, [reduceMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.8 : glowIntensity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { scale: reduceMotion ? 1 : scale.value },
      { rotateY: reduceMotion ? '0deg' : `${rotationY.value}deg` },
      { rotateX: reduceMotion ? '0deg' : `${rotationX.value}deg` },
    ],
  }));

  const logoSize = size;
  const strokeWidth = size * 0.18;
  const strokeHeight = size * 0.65;

  return (
    <View style={[styles.container, { width: logoSize, height: logoSize }]}>
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={['rgba(100, 255, 218, 0.4)', 'rgba(120, 220, 255, 0.3)', 'rgba(200, 160, 255, 0.2)']}
          style={[styles.glow, { width: logoSize * 1.8, height: logoSize * 1.8, borderRadius: logoSize * 0.9 }]}
        />
      </Animated.View>

      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <View style={[styles.logoBackground, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.22 }]}>
          <LinearGradient
            colors={['rgba(15, 15, 20, 0.98)', 'rgba(8, 8, 12, 0.99)']}
            style={styles.gradientBg}
          />

          <View style={styles.xContainer}>
            <View
              style={[
                styles.xStrokeDepth1,
                {
                  width: strokeWidth,
                  height: strokeHeight,
                  left: logoSize * 0.23,
                  top: logoSize * 0.175,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(60, 200, 180, 0.4)', 'rgba(40, 120, 140, 0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.strokeGradient}
              />
            </View>

            <View
              style={[
                styles.xStrokeDepth2,
                {
                  width: strokeWidth,
                  height: strokeHeight,
                  right: logoSize * 0.23,
                  top: logoSize * 0.175,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(160, 120, 200, 0.4)', 'rgba(100, 80, 160, 0.6)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.strokeGradient}
              />
            </View>

            <View
              style={[
                styles.xStroke,
                styles.xStroke1,
                {
                  width: strokeWidth,
                  height: strokeHeight,
                  left: logoSize * 0.25,
                  top: logoSize * 0.175,
                },
              ]}
            >
              <LinearGradient
                colors={['#60FFDA', '#40E0C0', '#78DCFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.strokeGradient}
              />
              <View style={styles.highlight}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.highlightGradient}
                />
              </View>
              <View style={styles.edgeLight}>
                <LinearGradient
                  colors={['rgba(96, 255, 218, 0.9)', 'rgba(96, 255, 218, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.edgeLightGradient}
                />
              </View>
            </View>

            <View
              style={[
                styles.xStroke,
                styles.xStroke2,
                {
                  width: strokeWidth,
                  height: strokeHeight,
                  right: logoSize * 0.25,
                  top: logoSize * 0.175,
                },
              ]}
            >
              <LinearGradient
                colors={['#C8A0FF', '#A080E0', '#78DCFF']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.strokeGradient}
              />
              <View style={styles.highlight}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.6)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.highlightGradient}
                />
              </View>
              <View style={styles.edgeLight}>
                <LinearGradient
                  colors={['rgba(200, 160, 255, 0.9)', 'rgba(200, 160, 255, 0)']}
                  start={{ x: 1, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.edgeLightGradient}
                />
              </View>
            </View>
          </View>

          <View style={[styles.border, { borderRadius: logoSize * 0.22, borderWidth: 1.5 }]}>
            <LinearGradient
              colors={['rgba(100, 255, 218, 0.5)', 'rgba(120, 220, 255, 0.4)', 'rgba(200, 160, 255, 0.3)']}
              style={[styles.borderGradient, { borderRadius: logoSize * 0.22 }]}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  logoWrapper: {
    position: 'relative',
  },
  logoBackground: {
    position: 'relative',
    overflow: 'hidden',
    shadowColor: 'rgba(100, 255, 218, 0.6)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  xContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  xStrokeDepth1: {
    position: 'absolute',
    borderRadius: 100,
    transform: [{ rotate: '45deg' }, { translateX: 2 }, { translateY: 2 }],
    opacity: 0.6,
  },
  xStrokeDepth2: {
    position: 'absolute',
    borderRadius: 100,
    transform: [{ rotate: '-45deg' }, { translateX: -2 }, { translateY: 2 }],
    opacity: 0.6,
  },
  xStroke: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: 'rgba(120, 220, 255, 0.8)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  xStroke1: {
    transform: [{ rotate: '45deg' }],
  },
  xStroke2: {
    transform: [{ rotate: '-45deg' }],
  },
  strokeGradient: {
    flex: 1,
    borderRadius: 100,
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    overflow: 'hidden',
  },
  highlightGradient: {
    flex: 1,
  },
  edgeLight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '25%',
    overflow: 'hidden',
  },
  edgeLightGradient: {
    flex: 1,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'transparent',
  },
  borderGradient: {
    flex: 1,
  },
});
