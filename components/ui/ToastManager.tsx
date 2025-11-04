/**
 * Unified Toast Notification System
 *
 * Centralized toast manager with support for:
 * - Success, error, warning, info types
 * - Auto-dismiss with configurable duration
 * - Queue management for multiple toasts
 * - Haptic feedback on native platforms
 * - Accessibility support
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Dimensions } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, shadows } from '@/constants/theme';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, maxToasts = 3 }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const triggerHaptic = (type: ToastType) => {
    if (Platform.OS !== 'web') {
      try {
        switch (type) {
          case 'success':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'error':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'warning':
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          default:
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        console.warn('Haptics error:', e);
      }
    }
  };

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 3000,
    };

    triggerHaptic(toast.type);

    setToasts((current) => {
      const updated = [...current, newToast];
      // Limit number of toasts
      if (updated.length > maxToasts) {
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    // Auto-dismiss
    if (newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 4000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message, duration: 4000 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo, hideToast }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => hideToast(toast.id)}
            index={index}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
  index: number;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss, index }) => {
  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          color: colors.success,
          bgColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
        };
      case 'error':
        return {
          icon: XCircle,
          color: colors.danger,
          bgColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.4)',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: colors.warning,
          bgColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.4)',
        };
      case 'info':
      default:
        return {
          icon: Info,
          color: colors.info,
          bgColor: 'rgba(59, 130, 246, 0.15)',
          borderColor: 'rgba(59, 130, 246, 0.4)',
        };
    }
  };

  const config = getToastConfig(toast.type);
  const Icon = config.icon;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(15)}
      exiting={SlideOutUp.springify().damping(15)}
      layout={Layout.springify().damping(15)}
      style={[
        styles.toast,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          marginBottom: index === 0 ? 0 : spacing.sm,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${toast.type} notification: ${toast.title}`}
      accessibilityLiveRegion="polite"
    >
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
            <Icon size={24} color={config.color} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {toast.title}
            </Text>
            {toast.message && (
              <Text style={styles.message} numberOfLines={2}>
                {toast.message}
              </Text>
            )}
          </View>

          {toast.action && (
            <Pressable
              style={styles.actionButton}
              onPress={toast.action.onPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={toast.action.label}
            >
              <Text style={[styles.actionText, { color: config.color }]}>
                {toast.action.label}
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.closeButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification"
          >
            <X size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.glass,
    maxWidth: width > 768 ? 500 : undefined,
    alignSelf: 'center',
    width: '100%',
  },
  blurContainer: {
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    lineHeight: 20,
  },
  message: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  actionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  closeButton: {
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
});
