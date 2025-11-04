import React from 'react';
import { Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  QuantumColors,
  QuantumAnimation,
  QuantumTypography,
  QuantumRadius,
} from '@/constants/quantum-glass';

interface PlasmaCapsuleProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PlasmaCapsule({ title, onPress, disabled = false, loading = false }: PlasmaCapsuleProps) {
  const scale = useSharedValue(1);
  const highlightX = useSharedValue(-100);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightX.value }],
  }));

  const handlePressIn = () => {
    if (disabled || loading) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    scale.value = withTiming(0.985, {
      duration: 100,
      easing: Easing.bezier(...QuantumAnimation.curve),
    });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 200,
      easing: Easing.bezier(...QuantumAnimation.curve),
    });
  };

  const handlePress = () => {
    if (disabled || loading) return;

    highlightX.value = -100;
    highlightX.value = withTiming(400, {
      duration: QuantumAnimation.timing.cta,
      easing: Easing.bezier(...QuantumAnimation.curve),
    });

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onPress();
  };

  const gradientColors: readonly [string, string] = disabled
    ? ['rgba(0,245,212,0.3)', 'rgba(0,209,255,0.3)']
    : [QuantumColors.ionTeal, QuantumColors.iceBlue];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.container, animatedStyle]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        locations={[0, 1]}
        style={[
          styles.gradient,
          disabled && styles.gradientDisabled,
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.sheen}
        />

        <Animated.View style={[styles.highlight, highlightStyle]}>
          <LinearGradient
            colors={[
              'rgba(255,255,255,0)',
              'rgba(255,255,255,0.3)',
              'rgba(255,255,255,0)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.highlightGradient}
          />
        </Animated.View>

        <Animated.View style={styles.innerBorder} />

        {loading ? (
          <ActivityIndicator color="#000000" size="small" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>

      {!disabled && !loading && (
        <Animated.View style={[styles.outerGlow, { pointerEvents: 'none' }]}>
          <LinearGradient
            colors={[
              'rgba(0,210,255,0.3)',
              'rgba(0,210,255,0)',
            ]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.glowGradient}
          />
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 62,
    marginBottom: 24,
    borderRadius: QuantumRadius.pill,
    overflow: 'visible',
  },
  gradient: {
    flex: 1,
    borderRadius: QuantumRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: QuantumColors.iceBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientDisabled: {
    shadowOpacity: 0,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    left: -100,
  },
  highlightGradient: {
    flex: 1,
    transform: [{ skewX: '-20deg' }],
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: QuantumRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  text: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
    fontFamily: QuantumTypography.family.heading,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    zIndex: 1,
  },
  outerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: QuantumRadius.pill,
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    zIndex: -1,
  },
  glowGradient: {
    flex: 1,
    borderRadius: QuantumRadius.pill + 4,
  },
});
