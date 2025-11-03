import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography, radius } from '@/constants/theme';

type BannerType = 'info' | 'success' | 'warning' | 'error';

interface AccessibleStatusBannerProps {
  visible: boolean;
  type: BannerType;
  message: string;
  onDismiss?: () => void;
  dismissible?: boolean;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  position?: 'top' | 'bottom';
  accessibilityAnnouncement?: string;
}

export function AccessibleStatusBanner({
  visible,
  type,
  message,
  onDismiss,
  dismissible = true,
  autoDismiss = false,
  autoDismissDelay = 5000,
  position = 'top',
  accessibilityAnnouncement,
}: AccessibleStatusBannerProps) {
  const [slideAnim] = useState(new Animated.Value(position === 'top' ? -100 : 100));

  useEffect(() => {
    if (visible) {
      // Haptic feedback
      if (Platform.OS !== 'web') {
        try {
          const feedbackType =
            type === 'error'
              ? Haptics.NotificationFeedbackType.Error
              : type === 'success'
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning;
          Haptics.notificationAsync(feedbackType);
        } catch (e) {}
      }

      // Screen reader announcement
      const announcement = accessibilityAnnouncement || `${getTypeLabel(type)}: ${message}`;
      AccessibilityInfo.announceForAccessibility(announcement);

      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto dismiss
      if (autoDismiss && onDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissDelay);

        return () => clearTimeout(timer);
      }
    } else {
      // Slide out animation
      Animated.spring(slideAnim, {
        toValue: position === 'top' ? -100 : 100,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [visible, type, message, autoDismiss, autoDismissDelay, position]);

  const handleDismiss = () => {
    if (!dismissible || !onDismiss) return;

    Animated.spring(slideAnim, {
      toValue: position === 'top' ? -100 : 100,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      onDismiss();
    });

    AccessibilityInfo.announceForAccessibility('Banner dismissed');
  };

  const getTypeLabel = (bannerType: BannerType): string => {
    switch (bannerType) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Information';
    }
  };

  const getIcon = () => {
    const iconSize = 20;
    const iconProps = { size: iconSize, strokeWidth: 2.5 };

    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} color="#10B981" />;
      case 'error':
        return <AlertCircle {...iconProps} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle {...iconProps} color="#F59E0B" />;
      default:
        return <Info {...iconProps} color="#3B82F6" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.15)';
      case 'error':
        return 'rgba(239, 68, 68, 0.15)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.15)';
      default:
        return 'rgba(59, 130, 246, 0.15)';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.4)';
      case 'error':
        return 'rgba(239, 68, 68, 0.4)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)';
      default:
        return 'rgba(59, 130, 246, 0.4)';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.positionTop : styles.positionBottom,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
      accessibilityLabel={`${getTypeLabel(type)}: ${message}${dismissible ? '. Swipe or double tap to dismiss' : ''}`}
    >
      <BlurView
        intensity={80}
        tint="dark"
        style={[
          styles.banner,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer} accessible={false}>
            {getIcon()}
          </View>

          <Text
            style={styles.message}
            numberOfLines={3}
            accessible={true}
            accessibilityRole="text"
          >
            {message}
          </Text>

          {dismissible && onDismiss && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss banner"
              accessibilityHint={`Closes this ${type} message`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 9999,
  },
  positionTop: {
    top: Platform.select({ ios: 60, android: 20, default: 20 }),
  },
  positionBottom: {
    bottom: Platform.select({ ios: 40, android: 20, default: 20 }),
  },
  banner: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    minHeight: 56,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  message: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: colors.text,
    lineHeight: Typography.size.sm * 1.4,
  },
  dismissButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
    borderRadius: radius.sm,
  },
});
