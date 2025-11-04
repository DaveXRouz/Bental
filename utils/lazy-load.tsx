import React, { Suspense, ComponentType, lazy as reactLazy } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

/**
 * Default loading fallback component
 */
function DefaultLoadingFallback() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

/**
 * Lazy load a component with automatic Suspense boundary
 *
 * Optimizes bundle size by code-splitting components and loading them on demand.
 * Automatically adds a Suspense boundary with a loading indicator.
 *
 * @param importFn - Dynamic import function that returns the component
 * @param fallback - Optional custom loading component
 * @returns Lazy-loaded component wrapped in Suspense
 *
 * @example
 * ```tsx
 * // Basic usage
 * const MarketsScreen = lazyLoad(() => import('./markets'));
 *
 * // With custom loading
 * const TradeScreen = lazyLoad(
 *   () => import('./trade'),
 *   <CustomLoader />
 * );
 *
 * // In navigation
 * <Tabs.Screen name="markets" component={MarketsScreen} />
 * ```
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode = <DefaultLoadingFallback />
): React.FC<React.ComponentProps<T>> {
  const LazyComponent = reactLazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload a lazy component
 *
 * Starts loading a component before it's needed to reduce perceived loading time.
 * Call this when hovering over a navigation item or when predicting user navigation.
 *
 * @param importFn - Same import function passed to lazyLoad
 *
 * @example
 * ```tsx
 * const MarketsScreen = lazyLoad(() => import('./markets'));
 *
 * // Preload on hover or prediction
 * function NavigationButton() {
 *   return (
 *     <TouchableOpacity
 *       onMouseEnter={() => preload(() => import('./markets'))}
 *       onPress={navigateToMarkets}
 *     >
 *       <Text>Markets</Text>
 *     </TouchableOpacity>
 *   );
 * }
 * ```
 */
export function preload(importFn: () => Promise<{ default: any }>) {
  importFn().catch(() => {
    // Silently fail preloading
    // The component will still load when needed
  });
}

/**
 * Create a lazy component with retry logic
 *
 * Automatically retries loading if it fails (useful for flaky network conditions).
 *
 * @param importFn - Dynamic import function
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 1000)
 * @returns Lazy-loaded component with retry capability
 *
 * @example
 * ```tsx
 * const ReliableComponent = lazyLoadWithRetry(
 *   () => import('./heavy-component'),
 *   3,  // Max 3 retries
 *   1000 // 1 second delay
 * );
 * ```
 */
export function lazyLoadWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): React.FC<React.ComponentProps<T>> {
  const retryImport = async (attempt: number = 0): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return retryImport(attempt + 1);
      }
      throw error;
    }
  };

  return lazyLoad(() => retryImport());
}

/**
 * Batch preload multiple components
 *
 * Useful for preloading all tab screens or a group of related components.
 *
 * @param importFns - Array of import functions to preload
 *
 * @example
 * ```tsx
 * // Preload all tab screens on app start
 * useEffect(() => {
 *   batchPreload([
 *     () => import('./portfolio'),
 *     () => import('./markets'),
 *     () => import('./trade'),
 *   ]);
 * }, []);
 * ```
 */
export function batchPreload(importFns: Array<() => Promise<{ default: any }>>) {
  importFns.forEach(fn => preload(fn));
}

/**
 * Conditionally lazy load based on feature flag or condition
 *
 * @param condition - Boolean condition to determine if component should be lazy loaded
 * @param importFn - Import function for lazy loading
 * @param Component - Regular component to use if not lazy loading
 * @returns Either lazy or regular component based on condition
 *
 * @example
 * ```tsx
 * const HeavyChart = conditionalLazyLoad(
 *   shouldOptimize,
 *   () => import('./heavy-chart'),
 *   SimpleChart
 * );
 * ```
 */
export function conditionalLazyLoad<T extends ComponentType<any>>(
  condition: boolean,
  importFn: () => Promise<{ default: T }>,
  Component: T
): T | React.FC<React.ComponentProps<T>> {
  return condition ? lazyLoad(importFn) : Component;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
});
