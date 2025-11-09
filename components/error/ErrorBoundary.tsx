/**
 * Global Error Boundary
 *
 * Catches JavaScript errors anywhere in the component tree,
 * logs them, and displays a fallback UI with recovery options.
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { handleGlobalError, shouldSuppressError } from '@/utils/error-manager';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if this error should be suppressed
    if (shouldSuppressError(error)) {
      // Reset error boundary without showing error UI
      this.resetError();
      return;
    }

    // Categorize and log error using error manager
    const categorized = handleGlobalError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Send to Sentry or other error tracking service
    if (categorized.category === 'critical' || categorized.category === 'warning') {
      // TODO: Integrate with actual error tracking
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  goHome = () => {
    this.resetError();
    router.replace('/(tabs)');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconContainer}>
              <AlertTriangle size={64} color={colors.danger} />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.resetError}
                activeOpacity={0.8}
              >
                <RefreshCw size={20} color={colors.white} />
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.goHome}
                activeOpacity={0.8}
              >
                <Home size={20} color={colors.white} />
                <Text style={styles.buttonText}>Go Home</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information</Text>
                <View style={styles.debugContent}>
                  <Text style={styles.debugLabel}>Error:</Text>
                  <Text style={styles.debugText}>{this.state.error.toString()}</Text>

                  {this.state.errorInfo && (
                    <>
                      <Text style={[styles.debugLabel, { marginTop: 16 }]}>
                        Component Stack:
                      </Text>
                      <Text style={styles.debugText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxxl,
    maxWidth: 400,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: colors.grey[700],
  },
  buttonText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.white,
  },
  debugContainer: {
    width: '100%',
    maxWidth: 600,
    marginTop: spacing.xxxl,
    padding: spacing.lg,
    backgroundColor: colors.grey[900],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  debugTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  debugContent: {
    gap: spacing.xs,
  },
  debugLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
  },
  debugText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
