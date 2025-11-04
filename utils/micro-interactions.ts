import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

/**
 * Haptic feedback patterns for different interactions
 */
export const hapticFeedback = {
  light: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  medium: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  heavy: () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  success: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  warning: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  error: () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  selection: () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  },
};

/**
 * Spring animation presets
 */
export const springPresets = {
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 0.8,
  },
  bouncy: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  snappy: {
    damping: 25,
    stiffness: 200,
    mass: 0.6,
  },
  smooth: {
    damping: 30,
    stiffness: 120,
    mass: 1,
  },
};

/**
 * Timing animation presets
 */
export const timingPresets = {
  quick: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },
  normal: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  slow: {
    duration: 500,
    easing: Easing.inOut(Easing.cubic),
  },
  elastic: {
    duration: 400,
    easing: Easing.elastic(1.2),
  },
};

/**
 * Common animation patterns
 */
export const animationPatterns = {
  /**
   * Scale button press animation
   */
  buttonPress: (scale: any, callback?: () => void) => {
    'worklet';
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 }, (finished) => {
        if (finished && callback) {
          runOnJS(callback)();
        }
      })
    );
  },

  /**
   * Shake animation for errors
   */
  shake: (translateX: any) => {
    'worklet';
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  },

  /**
   * Bounce animation
   */
  bounce: (translateY: any) => {
    'worklet';
    translateY.value = withSequence(
      withSpring(-20, springPresets.bouncy),
      withSpring(0, springPresets.bouncy)
    );
  },

  /**
   * Pulse animation
   */
  pulse: (scale: any, callback?: () => void) => {
    'worklet';
    scale.value = withSequence(
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 200 }, (finished) => {
        if (finished && callback) {
          runOnJS(callback)();
        }
      })
    );
  },

  /**
   * Fade in animation
   */
  fadeIn: (opacity: any, duration = 300) => {
    'worklet';
    opacity.value = withTiming(1, { duration });
  },

  /**
   * Fade out animation
   */
  fadeOut: (opacity: any, duration = 300, callback?: () => void) => {
    'worklet';
    opacity.value = withTiming(0, { duration }, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  },

  /**
   * Slide in from right
   */
  slideInRight: (translateX: any, distance = 100) => {
    'worklet';
    translateX.value = distance;
    translateX.value = withSpring(0, springPresets.smooth);
  },

  /**
   * Slide out to right
   */
  slideOutRight: (translateX: any, distance = 100, callback?: () => void) => {
    'worklet';
    translateX.value = withTiming(distance, timingPresets.normal, (finished) => {
      if (finished && callback) {
        runOnJS(callback)();
      }
    });
  },

  /**
   * Rotate 360 degrees
   */
  rotate360: (rotation: any) => {
    'worklet';
    rotation.value = withSequence(
      withTiming(360, { duration: 600, easing: Easing.linear }),
      withTiming(0, { duration: 0 })
    );
  },

  /**
   * Wiggle animation (for notifications)
   */
  wiggle: (rotation: any) => {
    'worklet';
    rotation.value = withSequence(
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  },

  /**
   * Success checkmark animation
   */
  successCheck: (scale: any, opacity: any) => {
    'worklet';
    opacity.value = 0;
    scale.value = 0;
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSequence(
      withSpring(1.2, springPresets.bouncy),
      withSpring(1, springPresets.gentle)
    );
  },

  /**
   * Loading pulse animation (infinite)
   */
  loadingPulse: (scale: any, opacity: any) => {
    'worklet';
    scale.value = withSequence(
      withTiming(1.1, { duration: 800 }),
      withTiming(1, { duration: 800 })
    );
    opacity.value = withSequence(
      withTiming(0.5, { duration: 800 }),
      withTiming(1, { duration: 800 })
    );
  },

  /**
   * Card flip animation
   */
  flip: (rotateY: any, callback?: () => void) => {
    'worklet';
    rotateY.value = withTiming(
      180,
      { duration: 600, easing: Easing.inOut(Easing.cubic) },
      (finished) => {
        if (finished && callback) {
          runOnJS(callback)();
        }
      }
    );
  },

  /**
   * Expand/collapse animation
   */
  expand: (height: any, targetHeight: number) => {
    'worklet';
    height.value = withSpring(targetHeight, springPresets.smooth);
  },

  collapse: (height: any) => {
    'worklet';
    height.value = withSpring(0, springPresets.smooth);
  },
};

/**
 * Stagger animation helper
 */
export const staggerAnimation = (
  items: any[],
  animationFn: (item: any, index: number) => void,
  delayBetween = 50
) => {
  items.forEach((item, index) => {
    setTimeout(() => {
      animationFn(item, index);
    }, index * delayBetween);
  });
};

/**
 * Sequential animation helper
 */
export const sequentialAnimation = async (
  animations: Array<() => Promise<void>>
) => {
  for (const animation of animations) {
    await animation();
  }
};

/**
 * Parallax effect helper
 */
export const parallaxEffect = (scrollY: any, multiplier = 0.5) => {
  'worklet';
  return scrollY.value * multiplier;
};

/**
 * Gesture animation helpers
 */
export const gestureAnimations = {
  /**
   * Swipe to dismiss
   */
  swipeToDismiss: (
    translateX: any,
    velocity: number,
    threshold: number,
    onDismiss: () => void
  ) => {
    'worklet';
    if (Math.abs(translateX.value) > threshold || Math.abs(velocity) > 500) {
      const direction = translateX.value > 0 ? 1 : -1;
      translateX.value = withTiming(direction * 500, timingPresets.quick, (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      });
    } else {
      translateX.value = withSpring(0, springPresets.snappy);
    }
  },

  /**
   * Pull to refresh
   */
  pullToRefresh: (
    translateY: any,
    threshold: number,
    onRefresh: () => void
  ) => {
    'worklet';
    if (translateY.value > threshold) {
      runOnJS(onRefresh)();
      translateY.value = withSpring(threshold * 0.5, springPresets.gentle);
    } else {
      translateY.value = withSpring(0, springPresets.snappy);
    }
  },

  /**
   * Long press scale
   */
  longPressScale: (scale: any, isPressed: boolean) => {
    'worklet';
    scale.value = withSpring(isPressed ? 0.95 : 1, springPresets.gentle);
  },
};

/**
 * Value interpolation helpers
 */
export const interpolateValue = (
  value: number,
  inputRange: number[],
  outputRange: number[]
) => {
  'worklet';
  const progress = Math.min(
    Math.max((value - inputRange[0]) / (inputRange[1] - inputRange[0]), 0),
    1
  );
  return outputRange[0] + progress * (outputRange[1] - outputRange[0]);
};
