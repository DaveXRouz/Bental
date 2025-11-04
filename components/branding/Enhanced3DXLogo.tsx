import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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

interface Enhanced3DXLogoProps {
  size?: number;
  reduceMotion?: boolean;
}

export function Enhanced3DXLogo({ size = 80, reduceMotion = false }: Enhanced3DXLogoProps) {
  const floatY = useSharedValue(0);
  const glowIntensity = useSharedValue(0.6);
  const rotationY = useSharedValue(0);
  const rotationX = useSharedValue(0);
  const scale = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const haloScale = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(8, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );

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
          withTiming(6, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(-6, { duration: 6000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0, { duration: 3000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );

      rotationX.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(4, { duration: 8000, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0, { duration: 4000, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );

      scale.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 12, stiffness: 100 }),
          withSpring(1, { damping: 12, stiffness: 100 })
        ),
        -1,
        false
      );

      shimmer.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );

      haloScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduceMotion ? 0 : floatY.value },
      { perspective: 1200 },
      { scale: reduceMotion ? 1 : scale.value },
      { rotateY: reduceMotion ? '0deg' : `${rotationY.value}deg` },
      { rotateX: reduceMotion ? '0deg' : `${rotationX.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.7 : glowIntensity.value,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: reduceMotion ? 1 : haloScale.value },
    ],
    opacity: reduceMotion ? 0.6 : interpolate(haloScale.value, [1, 1.15], [0.6, 0.3]),
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const shimmerTranslate = interpolate(shimmer.value, [0, 1], [-size * 2, size * 2]);
    return {
      transform: [{ translateX: shimmerTranslate }],
    };
  });

  const logoSize = size;
  const strokeWidth = size * 0.16;
  const strokeHeight = size * 0.68;

  return (
    <View style={[styles.container, { width: logoSize, height: logoSize }]}>
      <Animated.View style={[styles.halo, haloStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(200, 200, 200, 0.1)', 'rgba(160, 160, 160, 0.08)']}
          style={[styles.haloGradient, {
            width: logoSize * 2.2,
            height: logoSize * 2.2,
            borderRadius: logoSize * 1.1
          }]}
        />
      </Animated.View>

      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.2)', 'rgba(192, 192, 192, 0.15)', 'rgba(160, 160, 160, 0.12)']}
          style={[styles.glow, {
            width: logoSize * 1.6,
            height: logoSize * 1.6,
            borderRadius: logoSize * 0.8
          }]}
        />
      </Animated.View>

      <Animated.View style={[styles.logoWrapper, containerStyle]}>
        <View style={[styles.logoBackground, {
          width: logoSize,
          height: logoSize,
          borderRadius: logoSize * 0.24
        }]}>
          <LinearGradient
            colors={['rgba(18, 18, 24, 0.98)', 'rgba(10, 10, 15, 0.99)', 'rgba(8, 8, 12, 1)']}
            style={styles.gradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.xContainer}>
            <View
              style={[
                styles.depthLayer,
                {
                  width: strokeWidth,
                  height: strokeHeight,
                  left: logoSize * 0.26,
                  top: logoSize * 0.16,
                  transform: [{ rotate: '45deg' }, { translateX: 3 }, { translateY: 3 }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(100, 100, 110, 0.4)', 'rgba(80, 80, 90, 0.5)']}
                style={styles.strokeGradient}
              />
            </View>

            <View
              style={[
                styles.depthLayer,
                {
                  width: strokeWidth,
                  height: strokeHeight,
                  right: logoSize * 0.26,
                  top: logoSize * 0.16,
                  transform: [{ rotate: '-45deg' }, { translateX: -3 }, { translateY: 3 }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(110, 110, 120, 0.4)', 'rgba(90, 90, 100, 0.5)']}
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
                  left: logoSize * 0.28,
                  top: logoSize * 0.16,
                },
              ]}
            >
              <LinearGradient
                colors={['#E8E8E8', '#C0C0C8', '#D0D0D8', '#F0F0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.strokeGradient}
              />

              <View style={[styles.metalReflection, { top: 0, height: '45%' }]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reflectionGradient}
                />
              </View>

              <View style={[styles.edgeHighlight, { left: 0, width: '30%' }]}>
                <LinearGradient
                  colors={['rgba(112, 255, 232, 1)', 'rgba(112, 255, 232, 0.4)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.highlightGradient}
                />
              </View>

              <View style={styles.chromeShine}>
                <Animated.View style={shimmerStyle}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.shimmerGradient, { width: size * 0.8 }]}
                  />
                </Animated.View>
              </View>
            </View>

            <View
              style={[
                styles.xStroke,
                styles.xStroke2,
                {
                  width: strokeWidth,
                  height: strokeHeight,
                  right: logoSize * 0.28,
                  top: logoSize * 0.16,
                },
              ]}
            >
              <LinearGradient
                colors={['#D8D8E0', '#B0B0B8', '#C8C8D0', '#E0E0E8']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.strokeGradient}
              />

              <View style={[styles.metalReflection, { top: 0, height: '45%' }]}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.7)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.reflectionGradient}
                />
              </View>

              <View style={[styles.edgeHighlight, { right: 0, width: '30%' }]}>
                <LinearGradient
                  colors={['rgba(216, 176, 255, 0.4)', 'rgba(216, 176, 255, 1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.highlightGradient}
                />
              </View>

              <View style={styles.chromeShine}>
                <Animated.View style={shimmerStyle}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.shimmerGradient, { width: size * 0.8 }]}
                  />
                </Animated.View>
              </View>
            </View>
          </View>

          <View style={[styles.border, { borderRadius: logoSize * 0.24, borderWidth: 2 }]}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.4)',
                'rgba(200, 200, 200, 0.35)',
                'rgba(160, 160, 160, 0.3)',
                'rgba(255, 255, 255, 0.4)'
              ]}
              style={[styles.borderGradient, { borderRadius: logoSize * 0.24 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
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
  halo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloGradient: {
    position: 'absolute',
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
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 16,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  xContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  depthLayer: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.5,
  },
  xStroke: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: 'rgba(255, 255, 255, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
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
  metalReflection: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    overflow: 'hidden',
  },
  reflectionGradient: {
    flex: 1,
  },
  edgeHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  highlightGradient: {
    flex: 1,
  },
  chromeShine: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 100,
  },
  shimmerGradient: {
    height: '100%',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'transparent',
  },
  borderGradient: {
    flex: 1,
  },
});
