/**
 * Unified Animation Library
 *
 * Extracted from Futuristic3DBackground and standardized for reuse across all screens.
 * Provides consistent animation patterns, timings, and easing functions.
 */

import { withRepeat, withSequence, withTiming, withSpring, Easing } from 'react-native-reanimated';

/**
 * Standard animation configurations
 */
export const AnimationConfig = {
  timing: {
    fast: 150,
    normal: 200,
    slow: 300,
    ultraSlow: 600,
  },

  easing: {
    smooth: Easing.bezier(0.4, 0, 0.6, 1),
    natural: Easing.bezier(0.45, 0.05, 0.55, 0.95),
    snappy: Easing.bezier(0.25, 0.1, 0.25, 1),
    linear: Easing.linear,
  },

  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 0.8 },
    bouncy: { damping: 12, stiffness: 80, mass: 1 },
    snappy: { damping: 18, stiffness: 180, mass: 0.5 },
    soft: { damping: 25, stiffness: 120, mass: 1 },
  },
};

/**
 * Float animation - vertical movement
 */
export const createFloatAnimation = (
  distance: number = 35,
  duration: number = 8000,
  easing = AnimationConfig.easing.natural
) => {
  return withRepeat(
    withSequence(
      withTiming(-distance, { duration: duration / 2, easing }),
      withTiming(distance, { duration: duration / 2, easing })
    ),
    -1,
    false
  );
};

/**
 * Drift animation - horizontal movement
 */
export const createDriftAnimation = (
  distance: number = 25,
  duration: number = 9000,
  easing = AnimationConfig.easing.natural
) => {
  return withRepeat(
    withSequence(
      withTiming(distance, { duration: duration / 3, easing }),
      withTiming(-distance, { duration: duration / 3, easing }),
      withTiming(0, { duration: duration / 3, easing })
    ),
    -1,
    false
  );
};

/**
 * Rotation animation - continuous spin
 */
export const createRotationAnimation = (duration: number = 20000) => {
  return withRepeat(
    withTiming(360, { duration, easing: AnimationConfig.easing.linear }),
    -1,
    false
  );
};

/**
 * Scale pulse animation - breathing effect
 */
export const createPulseAnimation = (
  minScale: number = 0.9,
  maxScale: number = 1.2,
  config = AnimationConfig.spring.gentle
) => {
  return withRepeat(
    withSequence(
      withSpring(maxScale, config),
      withSpring(minScale, config),
      withSpring(1, config)
    ),
    -1,
    false
  );
};

/**
 * Opacity fade animation
 */
export const createFadeAnimation = (
  minOpacity: number = 0.25,
  maxOpacity: number = 0.6,
  duration: number = 6000,
  easing = AnimationConfig.easing.smooth
) => {
  return withRepeat(
    withSequence(
      withTiming(maxOpacity, { duration: duration / 2, easing }),
      withTiming(minOpacity, { duration: duration / 2, easing })
    ),
    -1,
    true
  );
};

/**
 * Glow animation - ambient light pulsing
 */
export const createGlowAnimation = (duration: number = 5000) => {
  return withRepeat(
    withSequence(
      withTiming(1, { duration, easing: AnimationConfig.easing.natural }),
      withTiming(0, { duration, easing: AnimationConfig.easing.natural })
    ),
    -1,
    false
  );
};

/**
 * Entrance animation - fade in with scale
 */
export const createEntranceAnimation = (
  delay: number = 0,
  duration: number = 600
) => {
  return {
    opacity: withTiming(1, { duration, delay }),
    transform: [
      {
        scale: withSpring(1, {
          ...AnimationConfig.spring.snappy,
          delay,
        }),
      },
    ],
  };
};

/**
 * Exit animation - fade out with scale
 */
export const createExitAnimation = (duration: number = 300) => {
  return {
    opacity: withTiming(0, { duration }),
    transform: [
      {
        scale: withTiming(0.95, { duration }),
      },
    ],
  };
};

/**
 * Shimmer animation - loading effect
 */
export const createShimmerAnimation = (duration: number = 1500) => {
  return withRepeat(
    withTiming(1, { duration, easing: AnimationConfig.easing.linear }),
    -1,
    false
  );
};

/**
 * Bounce animation - playful spring
 */
export const createBounceAnimation = () => {
  return withSequence(
    withSpring(1.05, AnimationConfig.spring.bouncy),
    withSpring(0.95, AnimationConfig.spring.bouncy),
    withSpring(1, AnimationConfig.spring.bouncy)
  );
};

/**
 * Shake animation - error feedback
 */
export const createShakeAnimation = () => {
  return withSequence(
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(-10, { duration: 50 }),
    withTiming(10, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};

/**
 * Slide in animation - from direction
 */
export const createSlideInAnimation = (
  direction: 'left' | 'right' | 'up' | 'down',
  distance: number = 100,
  duration: number = 400
) => {
  const axis = direction === 'left' || direction === 'right' ? 'translateX' : 'translateY';
  const value = direction === 'left' || direction === 'up' ? -distance : distance;

  return {
    transform: [
      {
        [axis]: withTiming(0, { duration, easing: AnimationConfig.easing.smooth }),
      },
    ],
  };
};

/**
 * Stagger animation helper - for list items
 */
export const createStaggerDelay = (index: number, baseDelay: number = 50) => {
  return index * baseDelay;
};

/**
 * Press animation - interactive feedback
 */
export const createPressAnimation = () => {
  return withSequence(
    withSpring(0.95, { damping: 15, stiffness: 400 }),
    withSpring(1, { damping: 15, stiffness: 400 })
  );
};
