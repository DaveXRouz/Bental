import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
  BackHandler,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'primary' | 'destructive';
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

interface AccessibleAlertDialogProps {
  visible: boolean;
  onClose: () => void;
  type?: AlertType;
  title: string;
  message: string;
  actions: AlertAction[];
  dismissible?: boolean;
  announcementDelay?: number;
}

export function AccessibleAlertDialog({
  visible,
  onClose,
  type = 'info',
  title,
  message,
  actions,
  dismissible = true,
  announcementDelay = 300,
}: AccessibleAlertDialogProps) {
  const firstActionRef = useRef<typeof TouchableOpacity>(null);

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(
            type === 'error'
              ? Haptics.NotificationFeedbackType.Error
              : type === 'success'
              ? Haptics.NotificationFeedbackType.Success
              : Haptics.NotificationFeedbackType.Warning
          );
        } catch (e) {}
      }

      const timer = setTimeout(() => {
        AccessibilityInfo.announceForAccessibility(
          `${getAlertTypeLabel(type)} alert. ${title}. ${message}`
        );
      }, announcementDelay);

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (dismissible) {
          onClose();
          return true;
        }
        return false;
      });

      return () => {
        clearTimeout(timer);
        backHandler.remove();
      };
    }
  }, [visible, type, title, message, dismissible, onClose, announcementDelay]);

  const getIcon = () => {
    const iconSize = 28;
    switch (type) {
      case 'success':
        return <CheckCircle size={iconSize} color="#10B981" strokeWidth={2.5} />;
      case 'error':
        return <XCircle size={iconSize} color="#EF4444" strokeWidth={2.5} />;
      case 'warning':
        return <AlertTriangle size={iconSize} color="#F59E0B" strokeWidth={2.5} />;
      default:
        return <Info size={iconSize} color="#3B82F6" strokeWidth={2.5} />;
    }
  };

  const getAlertTypeLabel = (alertType: AlertType): string => {
    switch (alertType) {
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

  const getButtonStyle = (style?: 'default' | 'primary' | 'destructive') => {
    switch (style) {
      case 'primary':
        return styles.primaryButton;
      case 'destructive':
        return styles.destructiveButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style?: 'default' | 'primary' | 'destructive') => {
    switch (style) {
      case 'primary':
        return styles.primaryButtonText;
      case 'destructive':
        return styles.destructiveButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissible ? onClose : undefined}
      statusBarTranslucent
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel={`${getAlertTypeLabel(type)} dialog: ${title}`}
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={dismissible ? onClose : undefined}
            disabled={!dismissible}
            accessible={false}
          />
        </BlurView>

        <View style={styles.container}>
          <BlurView intensity={100} tint="dark" style={styles.dialog}>
            <View style={styles.content}>
              {dismissible && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close dialog"
                  accessibilityHint="Dismisses the alert dialog"
                >
                  <X size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              <View style={styles.iconContainer}>{getIcon()}</View>

              <View
                accessible={true}
                accessibilityRole="header"
                accessibilityLabel={title}
              >
                <Text style={styles.title}>{title}</Text>
              </View>

              <View
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={message}
              >
                <Text style={styles.message}>{message}</Text>
              </View>

              <View
                style={styles.actions}
                accessible={false}
              >
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    ref={index === 0 ? firstActionRef : null}
                    style={[styles.actionButton, getButtonStyle(action.style)]}
                    onPress={() => {
                      action.onPress();
                      onClose();
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={action.accessibilityLabel || action.label}
                    accessibilityHint={
                      action.accessibilityHint ||
                      `Performs ${action.label.toLowerCase()} action and closes the dialog`
                    }
                  >
                    <BlurView
                      intensity={60}
                      tint="dark"
                      style={[
                        styles.actionButtonInner,
                        action.style === 'primary' && styles.primaryButtonInner,
                        action.style === 'destructive' && styles.destructiveButtonInner,
                      ]}
                    >
                      <Text style={[styles.actionButtonText, getButtonTextStyle(action.style)]}>
                        {action.label}
                      </Text>
                    </BlurView>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </BlurView>
        </View>

        <View
          accessible={true}
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={styles.srOnly}
        >
          <Text>
            {getAlertTypeLabel(type)} alert: {title}. {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  dialog: {
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  content: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    fontSize: Typography.size.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.size.md * 1.5,
    marginBottom: Spacing.xl,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  actionButton: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 48,
  },
  actionButtonInner: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  actionButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  defaultButton: {},
  defaultButtonText: {
    color: colors.text,
  },
  primaryButton: {},
  primaryButtonInner: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  primaryButtonText: {
    color: '#3B82F6',
  },
  destructiveButton: {},
  destructiveButtonInner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  destructiveButtonText: {
    color: '#EF4444',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
  } as any,
});
