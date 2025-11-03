import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Hook to detect if user prefers reduced motion
 *
 * Respects system-level accessibility settings:
 * - iOS: Settings > Accessibility > Motion > Reduce Motion
 * - Android: Settings > Accessibility > Remove animations
 * - Web: prefers-reduced-motion media query
 *
 * @returns boolean - true if reduced motion is preferred
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: Check prefers-reduced-motion media query
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      // Listen for changes
      const handler = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handler);
        return () => mediaQuery.removeListener(handler);
      }
    } else {
      // Native: Check system accessibility settings
      AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
        setPrefersReducedMotion(enabled);
      });

      // Listen for changes
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (enabled) => {
          setPrefersReducedMotion(enabled);
        }
      );

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * Get animation duration based on reduced motion preference
 *
 * @param normalDuration - Duration in ms for normal motion
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Adjusted duration (0 if reduced motion is enabled)
 */
export function getAnimationDuration(
  normalDuration: number,
  reducedMotion: boolean
): number {
  return reducedMotion ? 0 : normalDuration;
}

/**
 * Get spring animation config based on reduced motion preference
 *
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Spring config object
 */
export function getSpringConfig(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      tension: 500,
      friction: 50,
      useNativeDriver: true,
    };
  }

  return {
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  };
}

/**
 * Get timing animation config based on reduced motion preference
 *
 * @param duration - Normal animation duration in ms
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Timing config object
 */
export function getTimingConfig(duration: number, reducedMotion: boolean) {
  return {
    duration: getAnimationDuration(duration, reducedMotion),
    useNativeDriver: true,
  };
}
