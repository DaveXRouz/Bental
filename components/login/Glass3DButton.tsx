import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
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
import { BlurView } from 'expo-blur';
import { spacing, typography, radius } from '@/constants/theme';

interface Glass3DButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
}

export function Glass3DButton({
  onPress,
  title,
  disabled = false,
  loading = false,
}: Glass3DButtonProps) {
  const shimmer = useSharedValue(0);
  const pulse = useSharedValue(0);
  const particleAnimation = useSharedValue(0);

  useEffect(() => {
    if (!disabled && !loading) {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 2500, easing: Easing.linear }),
        -1,
        false
      );

      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        false
      );
    }
  }, [disabled, loading]);

  useEffect(() => {
    if (loading) {
      particleAnimation.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [loading]);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);
    return {
      transform: [{ translateX }],
    };
  });

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.6, 1]),
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [1, 1.02]) },
    ],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { scale: withSpring(disabled || loading ? 0.98 : 1, { damping: 15 }) },
    ],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityLabel={title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        style={styles.touchable}
      >
        <BlurView intensity={50} tint="light" style={styles.blur}>
          <Animated.View style={pulseStyle}>
            <LinearGradient
              colors={
                disabled || loading
                  ? ['rgba(40, 40, 50, 0.9)', 'rgba(30, 30, 40, 0.95)']
                  : [
                      'rgba(96, 255, 218, 0.35)',
                      'rgba(120, 220, 255, 0.30)',
                      'rgba(200, 160, 255, 0.25)',
                    ]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />

            <View style={styles.topReflection}>
              <LinearGradient
                colors={[
                  'rgba(255, 255, 255, 0.4)',
                  'rgba(255, 255, 255, 0.1)',
                  'transparent',
                ]}
                style={styles.reflectionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            </View>

            {!disabled && !loading && (
              <Animated.View style={[styles.shimmerContainer, shimmerStyle]}>
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(255, 255, 255, 0.3)',
                    'rgba(255, 255, 255, 0.5)',
                    'rgba(255, 255, 255, 0.3)',
                    'transparent',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmer}
                />
              </Animated.View>
            )}

            <View style={styles.contentContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    color="rgba(96, 255, 218, 0.9)"
                    size="small"
                  />
                  {[...Array(6)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.particle,
                        {
                          left: `${(i * 360) / 6}deg`,
                        },
                        useAnimatedStyle(() => ({
                          transform: [
                            {
                              rotate: `${interpolate(
                                particleAnimation.value,
                                [0, 1],
                                [0, 360]
                              )}deg`,
                            },
                          ],
                          opacity: interpolate(
                            particleAnimation.value,
                            [0, 0.5, 1],
                            [0.3, 1, 0.3]
                          ),
                        })),
                      ]}
                    />
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    styles.text,
                    (disabled || loading) && styles.textDisabled,
                  ]}
                >
                  {title}
                </Text>
              )}
            </View>

            <View style={styles.border}>
              <LinearGradient
                colors={
                  disabled || loading
                    ? ['rgba(100, 100, 110, 0.3)', 'rgba(80, 80, 90, 0.3)']
                    : [
                        'rgba(96, 255, 218, 0.7)',
                        'rgba(120, 220, 255, 0.6)',
                        'rgba(200, 160, 255, 0.5)',
                        'rgba(96, 255, 218, 0.7)',
                      ]
                }
                style={styles.borderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </Animated.View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 54,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: 'rgba(96, 255, 218, 0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  touchable: {
    flex: 1,
  },
  blur: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: radius.lg,
    position: 'relative',
  },
  topReflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
  },
  reflectionGradient: {
    flex: 1,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    overflow: 'hidden',
  },
  shimmer: {
    width: 100,
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(96, 255, 218, 0.8)',
  },
  text: {
    fontSize: typography.size.md + 1,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(96, 255, 218, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  textDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
    textShadowColor: 'transparent',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  borderGradient: {
    flex: 1,
    borderRadius: radius.lg,
  },
});
