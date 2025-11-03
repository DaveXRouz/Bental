import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { QuantumColors } from '@/constants/quantum-glass';

const { width, height } = Dimensions.get('window');

interface QuantumBackgroundProps {
  reduceMotion?: boolean;
}

export function QuantumBackground({ reduceMotion = false }: QuantumBackgroundProps) {
  const ring1Rotate = useSharedValue(0);
  const ring2Rotate = useSharedValue(0);
  const particle1Y = useSharedValue(0);
  const particle2Y = useSharedValue(0);
  const particle3Y = useSharedValue(0);
  const particle1X = useSharedValue(0);
  const particle2X = useSharedValue(0);
  const particle3X = useSharedValue(0);
  const particle1Opacity = useSharedValue(0.15);
  const particle2Opacity = useSharedValue(0.12);
  const particle3Opacity = useSharedValue(0.18);

  useEffect(() => {
    if (!reduceMotion) {
      ring1Rotate.value = withRepeat(
        withTiming(360, { duration: 120000, easing: Easing.linear }),
        -1,
        false
      );

      ring2Rotate.value = withRepeat(
        withTiming(-360, { duration: 150000, easing: Easing.linear }),
        -1,
        false
      );

      particle1Y.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 8000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-20, { duration: 8000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle2Y.value = withRepeat(
        withSequence(
          withTiming(-25, { duration: 10000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(25, { duration: 10000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle3Y.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 9000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-15, { duration: 9000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle1X.value = withRepeat(
        withSequence(
          withTiming(10, { duration: 7000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-10, { duration: 7000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle2X.value = withRepeat(
        withSequence(
          withTiming(-12, { duration: 8500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(12, { duration: 8500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle3X.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 7500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-8, { duration: 7500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle1Opacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 6000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.08, { duration: 6000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle2Opacity.value = withRepeat(
        withSequence(
          withTiming(0.22, { duration: 7000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.06, { duration: 7000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      particle3Opacity.value = withRepeat(
        withSequence(
          withTiming(0.28, { duration: 6500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.1, { duration: 6500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: reduceMotion ? '0deg' : `${ring1Rotate.value}deg` }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: reduceMotion ? '0deg' : `${ring2Rotate.value}deg` }],
  }));

  const particle1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : particle1X.value },
      { translateY: reduceMotion ? 0 : particle1Y.value },
    ],
    opacity: reduceMotion ? 0.12 : particle1Opacity.value,
  }));

  const particle2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : particle2X.value },
      { translateY: reduceMotion ? 0 : particle2Y.value },
    ],
    opacity: reduceMotion ? 0.1 : particle2Opacity.value,
  }));

  const particle3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : particle3X.value },
      { translateY: reduceMotion ? 0 : particle3Y.value },
    ],
    opacity: reduceMotion ? 0.14 : particle3Opacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          QuantumColors.deepSpace,
          QuantumColors.carbonNavy,
          QuantumColors.deepSpace,
        ]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      >
        <View style={styles.vignette} />

        <View style={styles.particleField}>
          <Animated.View style={[styles.particle1, particle1Style]} />
          <Animated.View style={[styles.particle2, particle2Style]} />
          <Animated.View style={[styles.particle3, particle3Style]} />
        </View>

        <Animated.View style={[styles.ring1, ring1Style]}>
          <View style={styles.ringInner1} />
        </Animated.View>

        <Animated.View style={[styles.ring2, ring2Style]}>
          <View style={styles.ringInner2} />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: width * 0.6,
  },
  particleField: {
    ...StyleSheet.absoluteFillObject,
  },
  particle1: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: QuantumColors.ionTeal,
    top: '20%',
    left: '15%',
  },
  particle2: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: QuantumColors.electricViolet,
    top: '65%',
    right: '20%',
  },
  particle3: {
    position: 'absolute',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: QuantumColors.iceBlue,
    top: '45%',
    left: '70%',
  },
  ring1: {
    position: 'absolute',
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    top: -width * 0.3,
    left: -width * 0.2,
  },
  ringInner1: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,245,212,0.08)',
    borderRadius: width * 0.7,
    shadowColor: QuantumColors.ionTeal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
  },
  ring2: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    bottom: -width * 0.4,
    right: -width * 0.3,
  },
  ringInner2: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(155,95,255,0.06)',
    borderRadius: width * 0.6,
    shadowColor: QuantumColors.electricViolet,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 35,
  },
});
