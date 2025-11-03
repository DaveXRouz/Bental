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
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

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

      rotation.value = withRepeat(
        withTiming(360, { duration: 20000, easing: Easing.linear }),
        -1,
        false
      );

      scale.value = withRepeat(
        withSequence(
          withSpring(1.05, { damping: 10, stiffness: 80 }),
          withSpring(1, { damping: 10, stiffness: 80 })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.8 : glowIntensity.value,
    transform: [
      { rotate: reduceMotion ? '0deg' : `${rotation.value}deg` },
    ],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: reduceMotion ? 1 : scale.value },
    ],
  }));

  const logoSize = size;
  const strokeWidth = size * 0.14;

  return (
    <View style={[styles.container, { width: logoSize, height: logoSize }]}>
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={['rgba(100, 255, 218, 0.3)', 'rgba(120, 220, 255, 0.2)', 'rgba(200, 160, 255, 0.15)']}
          style={[styles.glow, { width: logoSize * 1.6, height: logoSize * 1.6, borderRadius: logoSize * 0.8 }]}
        />
      </Animated.View>

      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <View style={[styles.logoBackground, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.25 }]}>
          <LinearGradient
            colors={['rgba(40, 40, 40, 0.95)', 'rgba(20, 20, 20, 0.98)']}
            style={styles.gradientBg}
          />

          <View style={styles.xContainer}>
            <View
              style={[
                styles.xStroke,
                styles.xStroke1,
                {
                  width: strokeWidth,
                  height: logoSize * 0.7,
                  left: logoSize * 0.28,
                  top: logoSize * 0.15,
                },
              ]}
            >
              <LinearGradient
                colors={['#60FFDA', '#78DCFF', '#C8A0FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.strokeGradient}
              />
            </View>

            <View
              style={[
                styles.xStroke,
                styles.xStroke2,
                {
                  width: strokeWidth,
                  height: logoSize * 0.7,
                  right: logoSize * 0.28,
                  top: logoSize * 0.15,
                },
              ]}
            >
              <LinearGradient
                colors={['#C8A0FF', '#78DCFF', '#60FFDA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.strokeGradient}
              />
            </View>
          </View>

          <View style={[styles.border, { borderRadius: logoSize * 0.25, borderWidth: 2 }]}>
            <LinearGradient
              colors={['rgba(100, 255, 218, 0.4)', 'rgba(120, 220, 255, 0.3)', 'rgba(200, 160, 255, 0.2)']}
              style={[styles.borderGradient, { borderRadius: logoSize * 0.25 }]}
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
    shadowColor: 'rgba(100, 255, 218, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  xContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  xStroke: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: 'rgba(120, 220, 255, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 5,
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
  border: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'transparent',
  },
  borderGradient: {
    flex: 1,
  },
});
