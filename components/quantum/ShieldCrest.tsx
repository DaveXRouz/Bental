import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Shield } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { QuantumColors, QuantumAnimation, QuantumElevation } from '@/constants/quantum-glass';

interface ShieldCrestProps {
  size?: number;
  reduceMotion?: boolean;
}

export function ShieldCrest({ size = 130, reduceMotion = false }: ShieldCrestProps) {
  const haloOpacity = useSharedValue(0.18);
  const shieldScale = useSharedValue(1);

  useEffect(() => {
    if (!reduceMotion) {
      haloOpacity.value = withRepeat(
        withSequence(
          withTiming(QuantumAnimation.breathing.opacityMax, {
            duration: QuantumAnimation.breathing.duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          withTiming(QuantumAnimation.breathing.opacityMin, {
            duration: QuantumAnimation.breathing.duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ),
        -1,
        false
      );

      shieldScale.value = withRepeat(
        withSequence(
          withTiming(1.02, {
            duration: QuantumAnimation.breathing.duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          withTiming(1, {
            duration: QuantumAnimation.breathing.duration,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.2 : haloOpacity.value,
  }));

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduceMotion ? 1 : shieldScale.value }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.halo,
          haloStyle,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(0,245,212,0.15)',
            'rgba(0,245,212,0.08)',
            'rgba(155,95,255,0.05)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.shieldContainer, shieldStyle]}>
        <BlurView intensity={24} tint="dark" style={styles.shieldBlur}>
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.shieldGradient, { borderRadius: size / 2 }]}
          >
            <View
              style={[
                styles.shieldContent,
                {
                  borderRadius: size / 2,
                  borderTopWidth: 2,
                  borderTopColor: 'rgba(255,255,255,0.2)',
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(155,95,255,0.3)',
                },
              ]}
            >
              <View style={styles.rimLight}>
                <LinearGradient
                  colors={[QuantumColors.ionTeal, 'rgba(0,245,212,0.5)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.rimGradient,
                    {
                      borderRadius: size / 2,
                    },
                  ]}
                />
              </View>

              <Shield size={size * 0.45} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </LinearGradient>
        </BlurView>
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
  },
  shieldContainer: {
    width: '100%',
    height: '100%',
    ...QuantumElevation.E4,
  },
  shieldBlur: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    overflow: 'hidden',
  },
  shieldGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: QuantumColors.ionTeal,
    position: 'relative',
    overflow: 'hidden',
  },
  rimLight: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  rimGradient: {
    flex: 1,
  },
});
