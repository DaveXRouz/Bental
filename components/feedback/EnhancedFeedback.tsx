import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

interface EnhancedFeedbackProps {
  type: FeedbackType;
  title: string;
  message?: string;
  visible: boolean;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  autoHide?: boolean;
  duration?: number;
}

const FEEDBACK_CONFIG = {
  success: {
    icon: CheckCircle2,
    color: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  error: {
    icon: XCircle,
    color: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  warning: {
    icon: AlertTriangle,
    color: colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  info: {
    icon: Info,
    color: colors.blue,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
};

export function EnhancedFeedback({
  type,
  title,
  message,
  visible,
  onDismiss,
  action,
  autoHide = false,
  duration = 4000,
}: EnhancedFeedbackProps) {
  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  React.useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      if (autoHide && onDismiss) {
        const timeout = setTimeout(onDismiss, duration);
        return () => clearTimeout(timeout);
      }
    }
  }, [visible, type, autoHide, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={[styles.container, { backgroundColor: config.backgroundColor }]}
    >
      <View style={styles.iconContainer}>
        <Icon size={24} color={config.color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}
      </View>

      {action && (
        <TouchableOpacity
          style={[styles.actionButton, { borderColor: config.color }]}
          onPress={action.onPress}
          activeOpacity={0.7}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          <Text style={[styles.actionText, { color: config.color }]}>
            {action.label}
          </Text>
          <ArrowRight size={16} color={config.color} />
        </TouchableOpacity>
      )}

      {onDismiss && !action && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
        >
          <XCircle size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// Enhanced error state for empty screens
interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  action?: {
    label: string;
    onPress: () => void;
    icon?: any;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon size={48} color={colors.textSecondary} />
      </View>

      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>

      {action && (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={action.onPress}
          activeOpacity={0.8}
          accessibilityLabel={action.label}
          accessibilityRole="button"
        >
          {action.icon && <action.icon size={20} color="#FFFFFF" />}
          <Text style={styles.emptyActionText}>{action.label}</Text>
        </TouchableOpacity>
      )}

      {secondaryAction && (
        <TouchableOpacity
          style={styles.emptySecondaryButton}
          onPress={secondaryAction.onPress}
          activeOpacity={0.8}
          accessibilityLabel={secondaryAction.label}
          accessibilityRole="button"
        >
          <Text style={styles.emptySecondaryText}>{secondaryAction.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Inline validation feedback
interface InlineFeedbackProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  visible: boolean;
}

export function InlineFeedback({ type, message, visible }: InlineFeedbackProps) {
  if (!visible) return null;

  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  return (
    <Animated.View
      entering={FadeInDown.duration(200)}
      exiting={FadeOutUp.duration(150)}
      style={[styles.inlineFeedback, { borderLeftColor: config.color }]}
    >
      <Icon size={16} color={config.color} />
      <Text style={[styles.inlineMessage, { color: config.color }]}>{message}</Text>
    </Animated.View>
  );
}

// Loading state with progress
interface LoadingFeedbackProps {
  message: string;
  progress?: number;
  visible: boolean;
}

export function LoadingFeedback({ message, progress, visible }: LoadingFeedbackProps) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={styles.loadingFeedback}
    >
      <View style={styles.loadingContent}>
        <View style={styles.spinner}>
          <RefreshCw size={20} color={colors.blue} />
        </View>
        <Text style={styles.loadingMessage}>{message}</Text>
      </View>

      {progress !== undefined && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.md,
    marginVertical: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginLeft: spacing.sm,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '600',
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    minHeight: 300,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.blue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  emptyActionText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptySecondaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  emptySecondaryText: {
    ...typography.body,
    color: colors.blue,
    fontWeight: '500',
  },
  inlineFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.sm,
    marginTop: spacing.xs,
  },
  inlineMessage: {
    ...typography.caption,
    flex: 1,
  },
  loadingFeedback: {
    padding: spacing.md,
    backgroundColor: 'rgba(20, 20, 22, 0.8)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMessage: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.full,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: radius.full,
  },
});
