import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface MinimalLogoProps {
  size?: number;
  reduceMotion?: boolean;
}

export function MinimalLogo({ size = 48, reduceMotion = false }: MinimalLogoProps) {
  const glowIntensity = useSharedValue(0.6);
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

      scale.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(1, { duration: 2500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: reduceMotion ? 1 : scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.4 : glowIntensity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(200, 200, 200, 0.08)', 'transparent']}
          style={[styles.glow, {
            width: size * 2,
            height: size * 2,
            borderRadius: size
          }]}
        />
      </Animated.View>

      <Animated.View style={[styles.logoWrapper, containerStyle]}>
        <View style={[styles.logoBackground, {
          width: size,
          height: size,
          borderRadius: size * 0.22
        }]}>
          <LinearGradient
            colors={['rgba(26, 26, 28, 0.95)', 'rgba(18, 18, 20, 0.98)', 'rgba(12, 12, 14, 1)']}
            style={styles.gradientBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.iconContainer}>
            <Svg
              width={size * 0.6}
              height={size * 0.6}
              viewBox="0 0 24 24"
              fill="none"
            >
              <Path
                d="M3 3L21 21M21 3L3 21"
                stroke="rgba(255, 255, 255, 0.9)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Svg>
          </View>

          <View style={[styles.border, { borderRadius: size * 0.22, borderWidth: 1.5 }]}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.25)',
                'rgba(220, 220, 220, 0.2)',
                'rgba(200, 200, 200, 0.15)',
                'rgba(255, 255, 255, 0.25)'
              ]}
              style={[styles.borderGradient, { borderRadius: size * 0.22 }]}
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
    shadowColor: 'rgba(255, 255, 255, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  iconContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderColor: 'transparent',
  },
  borderGradient: {
    flex: 1,
  },
});
