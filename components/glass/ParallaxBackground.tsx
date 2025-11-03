import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ParallaxBackgroundProps {
  reduceMotion?: boolean;
}

export function ParallaxBackground({ reduceMotion = false }: ParallaxBackgroundProps) {
  const layer1Y = useSharedValue(0);
  const layer1X = useSharedValue(0);
  const layer1Scale = useSharedValue(1);
  const layer1Opacity = useSharedValue(0.15);

  const layer2Y = useSharedValue(0);
  const layer2X = useSharedValue(0);
  const layer2Scale = useSharedValue(1);
  const layer2Opacity = useSharedValue(0.2);

  const layer3Y = useSharedValue(0);
  const layer3X = useSharedValue(0);
  const layer3Scale = useSharedValue(1);
  const layer3Opacity = useSharedValue(0.12);

  const layer4Y = useSharedValue(0);
  const layer4X = useSharedValue(0);
  const layer4Scale = useSharedValue(1);
  const layer4Opacity = useSharedValue(0.18);

  const layer5Y = useSharedValue(0);
  const layer5X = useSharedValue(0);
  const layer5Scale = useSharedValue(1);
  const layer5Opacity = useSharedValue(0.1);

  useEffect(() => {
    if (!reduceMotion) {
      layer1Y.value = withRepeat(
        withSequence(
          withTiming(30, { duration: 10000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-30, { duration: 10000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer1X.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 8000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(20, { duration: 8000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer1Scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 9000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.85, { duration: 9000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer1Opacity.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 7000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.1, { duration: 7000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      layer2Y.value = withRepeat(
        withSequence(
          withTiming(-25, { duration: 11000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(25, { duration: 11000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer2X.value = withRepeat(
        withSequence(
          withTiming(18, { duration: 9500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-18, { duration: 9500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer2Scale.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 10000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(1.2, { duration: 10000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer2Opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 8000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.12, { duration: 8000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      layer3Y.value = withRepeat(
        withSequence(
          withTiming(20, { duration: 9500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-20, { duration: 9500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer3X.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 10500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(15, { duration: 10500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer3Scale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 8500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.95, { duration: 8500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer3Opacity.value = withRepeat(
        withSequence(
          withTiming(0.22, { duration: 7500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.08, { duration: 7500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      layer4Y.value = withRepeat(
        withSequence(
          withTiming(-28, { duration: 12000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(28, { duration: 12000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer4X.value = withRepeat(
        withSequence(
          withTiming(22, { duration: 11000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-22, { duration: 11000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer4Scale.value = withRepeat(
        withSequence(
          withTiming(0.88, { duration: 9500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(1.18, { duration: 9500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer4Opacity.value = withRepeat(
        withSequence(
          withTiming(0.28, { duration: 8500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.1, { duration: 8500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );

      layer5Y.value = withRepeat(
        withSequence(
          withTiming(15, { duration: 10500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(-15, { duration: 10500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer5X.value = withRepeat(
        withSequence(
          withTiming(-25, { duration: 12500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(25, { duration: 12500, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer5Scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 11000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.92, { duration: 11000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
      layer5Opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 9000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(0.06, { duration: 9000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1,
        false
      );
    }
  }, [reduceMotion]);

  const layer1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : layer1X.value },
      { translateY: reduceMotion ? 0 : layer1Y.value },
      { scale: reduceMotion ? 1 : layer1Scale.value },
    ],
    opacity: reduceMotion ? 0.15 : layer1Opacity.value,
  }));

  const layer2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : layer2X.value },
      { translateY: reduceMotion ? 0 : layer2Y.value },
      { scale: reduceMotion ? 1 : layer2Scale.value },
    ],
    opacity: reduceMotion ? 0.2 : layer2Opacity.value,
  }));

  const layer3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : layer3X.value },
      { translateY: reduceMotion ? 0 : layer3Y.value },
      { scale: reduceMotion ? 1 : layer3Scale.value },
    ],
    opacity: reduceMotion ? 0.12 : layer3Opacity.value,
  }));

  const layer4Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : layer4X.value },
      { translateY: reduceMotion ? 0 : layer4Y.value },
      { scale: reduceMotion ? 1 : layer4Scale.value },
    ],
    opacity: reduceMotion ? 0.18 : layer4Opacity.value,
  }));

  const layer5Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: reduceMotion ? 0 : layer5X.value },
      { translateY: reduceMotion ? 0 : layer5Y.value },
      { scale: reduceMotion ? 1 : layer5Scale.value },
    ],
    opacity: reduceMotion ? 0.1 : layer5Opacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#1A1A1A', '#0A0A0A', '#000000']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        <View style={styles.vignette} />

        <Animated.View style={[styles.layer1, layer1Style]}>
          <View style={styles.shape1} />
        </Animated.View>

        <Animated.View style={[styles.layer2, layer2Style]}>
          <View style={styles.shape2} />
        </Animated.View>

        <Animated.View style={[styles.layer3, layer3Style]}>
          <View style={styles.shape3} />
        </Animated.View>

        <Animated.View style={[styles.layer4, layer4Style]}>
          <View style={styles.shape4} />
        </Animated.View>

        <Animated.View style={[styles.layer5, layer5Style]}>
          <View style={styles.shape5} />
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
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  layer1: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    zIndex: -5,
  },
  shape1: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    backgroundColor: 'rgba(100, 100, 100, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  layer2: {
    position: 'absolute',
    top: height * 0.4,
    right: width * 0.05,
    zIndex: -4,
  },
  shape2: {
    width: width * 0.4,
    height: width * 0.6,
    borderRadius: 24,
    backgroundColor: 'rgba(80, 80, 80, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  layer3: {
    position: 'absolute',
    top: height * 0.25,
    right: width * 0.2,
    zIndex: -3,
  },
  shape3: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 20,
    backgroundColor: 'rgba(120, 120, 120, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  layer4: {
    position: 'absolute',
    top: height * 0.6,
    left: width * 0.15,
    zIndex: -2,
  },
  shape4: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: width * 0.225,
    backgroundColor: 'rgba(90, 90, 90, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  layer5: {
    position: 'absolute',
    bottom: height * 0.2,
    right: width * 0.1,
    zIndex: -1,
  },
  shape5: {
    width: width * 0.3,
    height: width * 0.5,
    borderRadius: 28,
    backgroundColor: 'rgba(110, 110, 110, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
