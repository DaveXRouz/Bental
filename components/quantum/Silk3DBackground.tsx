import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width, height } = Dimensions.get('window');

interface Silk3DBackgroundProps {
  reduceMotion?: boolean;
}

export function Silk3DBackground({ reduceMotion = false }: Silk3DBackgroundProps) {
  const sphere1Progress = useSharedValue(0);
  const sphere2Progress = useSharedValue(0);
  const sphere3Progress = useSharedValue(0);

  const cube1Rotate = useSharedValue(0);
  const cube1Float = useSharedValue(0);

  const cube2Rotate = useSharedValue(0);
  const cube2Float = useSharedValue(0);

  const ring1Rotate = useSharedValue(0);
  const ring1Scale = useSharedValue(1);

  const ring2Rotate = useSharedValue(0);
  const ring2Scale = useSharedValue(1);

  const mesh1Opacity = useSharedValue(0.06);
  const mesh1Rotate = useSharedValue(0);

  const mesh2Opacity = useSharedValue(0.08);
  const mesh2Rotate = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) {
      sphere1Progress.value = withRepeat(
        withTiming(1, { duration: 15000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        -1,
        true
      );

      sphere2Progress.value = withRepeat(
        withTiming(1, { duration: 18000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        -1,
        true
      );

      sphere3Progress.value = withRepeat(
        withTiming(1, { duration: 20000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        -1,
        true
      );

      cube1Rotate.value = withRepeat(
        withTiming(360, { duration: 25000, easing: Easing.linear }),
        -1,
        false
      );

      cube1Float.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 4000, easing: Easing.bezier(0.45, 0, 0.55, 1) }),
          withTiming(-20, { duration: 4000, easing: Easing.bezier(0.45, 0, 0.55, 1) })
        ),
        -1,
        false
      );

      cube2Rotate.value = withRepeat(
        withTiming(-360, { duration: 30000, easing: Easing.linear }),
        -1,
        false
      );

      cube2Float.value = withRepeat(
        withSequence(
          withTiming(-25, { duration: 5000, easing: Easing.bezier(0.45, 0, 0.55, 1) }),
          withTiming(25, { duration: 5000, easing: Easing.bezier(0.45, 0, 0.55, 1) })
        ),
        -1,
        false
      );

      ring1Rotate.value = withRepeat(
        withTiming(360, { duration: 40000, easing: Easing.linear }),
        -1,
        false
      );

      ring1Scale.value = withRepeat(
        withSequence(
          withSpring(1.15, { damping: 10, stiffness: 50 }),
          withSpring(0.9, { damping: 10, stiffness: 50 })
        ),
        -1,
        false
      );

      ring2Rotate.value = withRepeat(
        withTiming(-360, { duration: 35000, easing: Easing.linear }),
        -1,
        false
      );

      ring2Scale.value = withRepeat(
        withSequence(
          withSpring(0.85, { damping: 10, stiffness: 50 }),
          withSpring(1.2, { damping: 10, stiffness: 50 })
        ),
        -1,
        false
      );

      mesh1Opacity.value = withRepeat(
        withSequence(
          withTiming(0.14, { duration: 6000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0.04, { duration: 6000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );

      mesh1Rotate.value = withRepeat(
        withTiming(360, { duration: 50000, easing: Easing.linear }),
        -1,
        false
      );

      mesh2Opacity.value = withRepeat(
        withSequence(
          withTiming(0.16, { duration: 7000, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(0.05, { duration: 7000, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        false
      );

      mesh2Rotate.value = withRepeat(
        withTiming(-360, { duration: 45000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const sphere1Style = useAnimatedStyle(() => {
    const translateX = interpolate(sphere1Progress.value, [0, 1], [-40, 40]);
    const translateY = interpolate(sphere1Progress.value, [0, 1], [-30, 30]);
    const scale = interpolate(sphere1Progress.value, [0, 0.5, 1], [0.9, 1.15, 0.9]);

    return {
      transform: [
        { translateX: reduceMotion ? 0 : translateX },
        { translateY: reduceMotion ? 0 : translateY },
        { scale: reduceMotion ? 1 : scale },
      ],
    };
  });

  const sphere2Style = useAnimatedStyle(() => {
    const translateX = interpolate(sphere2Progress.value, [0, 1], [35, -35]);
    const translateY = interpolate(sphere2Progress.value, [0, 1], [25, -25]);
    const scale = interpolate(sphere2Progress.value, [0, 0.5, 1], [1.1, 0.85, 1.1]);

    return {
      transform: [
        { translateX: reduceMotion ? 0 : translateX },
        { translateY: reduceMotion ? 0 : translateY },
        { scale: reduceMotion ? 1 : scale },
      ],
    };
  });

  const sphere3Style = useAnimatedStyle(() => {
    const translateX = interpolate(sphere3Progress.value, [0, 1], [-30, 30]);
    const translateY = interpolate(sphere3Progress.value, [0, 1], [40, -40]);
    const scale = interpolate(sphere3Progress.value, [0, 0.5, 1], [0.95, 1.2, 0.95]);

    return {
      transform: [
        { translateX: reduceMotion ? 0 : translateX },
        { translateY: reduceMotion ? 0 : translateY },
        { scale: reduceMotion ? 1 : scale },
      ],
    };
  });

  const cube1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduceMotion ? 0 : cube1Float.value },
      { rotateZ: reduceMotion ? '0deg' : `${cube1Rotate.value}deg` },
      { rotateY: reduceMotion ? '0deg' : `${cube1Rotate.value * 0.5}deg` },
    ],
  }));

  const cube2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: reduceMotion ? 0 : cube2Float.value },
      { rotateZ: reduceMotion ? '0deg' : `${cube2Rotate.value}deg` },
      { rotateX: reduceMotion ? '0deg' : `${cube2Rotate.value * 0.7}deg` },
    ],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: reduceMotion ? '0deg' : `${ring1Rotate.value}deg` },
      { scale: reduceMotion ? 1 : ring1Scale.value },
    ],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [
      { rotate: reduceMotion ? '0deg' : `${ring2Rotate.value}deg` },
      { scale: reduceMotion ? 1 : ring2Scale.value },
    ],
  }));

  const mesh1Style = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.08 : mesh1Opacity.value,
    transform: [
      { rotate: reduceMotion ? '0deg' : `${mesh1Rotate.value}deg` },
    ],
  }));

  const mesh2Style = useAnimatedStyle(() => ({
    opacity: reduceMotion ? 0.1 : mesh2Opacity.value,
    transform: [
      { rotate: reduceMotion ? '0deg' : `${mesh2Rotate.value}deg` },
    ],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1A1A1A', '#0D0D0D', '#000000']}
        locations={[0, 0.35, 0.65, 1]}
        style={styles.gradient}
      >
        <View style={styles.vignette} />

        <Animated.View style={[styles.mesh1, mesh1Style]}>
          <View style={styles.meshPattern} />
        </Animated.View>

        <Animated.View style={[styles.mesh2, mesh2Style]}>
          <View style={styles.meshPattern} />
        </Animated.View>

        <Animated.View style={[styles.sphere1, sphere1Style]}>
          <LinearGradient
            colors={['rgba(200, 200, 200, 0.15)', 'rgba(140, 140, 140, 0.08)']}
            style={styles.sphereInner}
          />
        </Animated.View>

        <Animated.View style={[styles.sphere2, sphere2Style]}>
          <LinearGradient
            colors={['rgba(180, 180, 180, 0.12)', 'rgba(120, 120, 120, 0.06)']}
            style={styles.sphereInner}
          />
        </Animated.View>

        <Animated.View style={[styles.sphere3, sphere3Style]}>
          <LinearGradient
            colors={['rgba(220, 220, 220, 0.18)', 'rgba(160, 160, 160, 0.09)']}
            style={styles.sphereInner}
          />
        </Animated.View>

        <Animated.View style={[styles.cube1, cube1Style]}>
          <View style={styles.cubeInner} />
        </Animated.View>

        <Animated.View style={[styles.cube2, cube2Style]}>
          <View style={styles.cubeInner} />
        </Animated.View>

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
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: width * 0.5,
  },
  mesh1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.3,
    left: -width * 0.25,
  },
  mesh2: {
    position: 'absolute',
    width: width * 1.3,
    height: width * 1.3,
    bottom: -width * 0.2,
    right: -width * 0.15,
  },
  meshPattern: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: width * 0.1,
    backgroundColor: 'rgba(60, 60, 60, 0.03)',
  },
  sphere1: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.12,
    left: width * 0.05,
  },
  sphere2: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    top: height * 0.45,
    right: width * 0.08,
  },
  sphere3: {
    position: 'absolute',
    width: width * 0.55,
    height: width * 0.55,
    bottom: height * 0.15,
    left: width * 0.1,
  },
  sphereInner: {
    flex: 1,
    borderRadius: width * 0.3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: 'rgba(200, 200, 200, 0.3)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  cube1: {
    position: 'absolute',
    width: width * 0.35,
    height: width * 0.35,
    top: height * 0.25,
    right: width * 0.15,
  },
  cube2: {
    position: 'absolute',
    width: width * 0.28,
    height: width * 0.28,
    bottom: height * 0.28,
    right: width * 0.12,
  },
  cubeInner: {
    flex: 1,
    backgroundColor: 'rgba(140, 140, 140, 0.12)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotateX: '45deg' }, { rotateY: '45deg' }],
  },
  ring1: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    top: height * 0.08,
    right: -width * 0.15,
  },
  ringInner1: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(200, 200, 200, 0.1)',
    borderRadius: width * 0.35,
    backgroundColor: 'transparent',
  },
  ring2: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    bottom: height * 0.1,
    left: -width * 0.2,
  },
  ringInner2: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(180, 180, 180, 0.08)',
    borderRadius: width * 0.4,
    backgroundColor: 'transparent',
  },
});
