import React, { Suspense, ComponentType } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import Animated, { FadeIn } from 'react-native-reanimated';

interface LazyTabScreenProps {
  importFn: () => Promise<{ default: ComponentType<any> }>;
  name: string;
}

/**
 * Loading fallback for lazy-loaded tab screens
 *
 * Shows a loading indicator with the tab name while the screen is loading.
 */
function TabLoadingFallback({ name }: { name: string }) {
  return (
    <View style={styles.loadingContainer}>
      <Animated.View entering={FadeIn} style={styles.loadingContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading {name}...</Text>
      </Animated.View>
    </View>
  );
}

/**
 * Error boundary fallback for lazy-loaded screens
 */
class LazyScreenErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[LazyScreen] Error loading ${this.props.name}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load {this.props.name}</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy-loaded tab screen wrapper with error boundary
 *
 * Wraps a lazy-loaded component with Suspense and error handling.
 * Provides consistent loading states for all tab screens.
 *
 * @param importFn - Dynamic import function for the screen
 * @param name - Display name for loading/error states
 *
 * @example
 * ```tsx
 * export default function MarketsTab() {
 *   return (
 *     <LazyTabScreen
 *       importFn={() => import('./markets')}
 *       name="Markets"
 *     />
 *   );
 * }
 * ```
 */
export function LazyTabScreen({ importFn, name }: LazyTabScreenProps) {
  const LazyComponent = React.lazy(importFn);

  return (
    <LazyScreenErrorBoundary name={name}>
      <Suspense fallback={<TabLoadingFallback name={name} />}>
        <LazyComponent />
      </Suspense>
    </LazyScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  loadingContent: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
    padding: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
