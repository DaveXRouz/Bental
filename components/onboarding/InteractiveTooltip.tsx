import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { X, ChevronRight, Info, Lightbulb, Zap } from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  BounceIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  visible: boolean;
  title: string;
  description: string;
  targetPosition?: { x: number; y: number; width: number; height: number };
  position?: TooltipPosition;
  onDismiss: () => void;
  onNext?: () => void;
  showPulse?: boolean;
  icon?: 'info' | 'lightbulb' | 'zap';
  primaryAction?: {
    label: string;
    onPress: () => void;
  };
}

export function InteractiveTooltip({
  visible,
  title,
  description,
  targetPosition,
  position = 'bottom',
  onDismiss,
  onNext,
  showPulse = true,
  icon = 'lightbulb',
  primaryAction,
}: TooltipProps) {
  const [tooltipLayout, setTooltipLayout] = useState({ width: 0, height: 0 });
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible && showPulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [visible, showPulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const getTooltipPosition = () => {
    if (!targetPosition || !tooltipLayout.width) {
      return { top: SCREEN_HEIGHT / 2, left: SCREEN_WIDTH / 2 - tooltipLayout.width / 2 };
    }

    const { x, y, width, height } = targetPosition;
    const padding = spacing.md;

    switch (position) {
      case 'top':
        return {
          top: y - tooltipLayout.height - padding,
          left: x + width / 2 - tooltipLayout.width / 2,
        };
      case 'bottom':
        return {
          top: y + height + padding,
          left: x + width / 2 - tooltipLayout.width / 2,
        };
      case 'left':
        return {
          top: y + height / 2 - tooltipLayout.height / 2,
          left: x - tooltipLayout.width - padding,
        };
      case 'right':
        return {
          top: y + height / 2 - tooltipLayout.height / 2,
          left: x + width + padding,
        };
      default:
        return { top: y + height + padding, left: x };
    }
  };

  const handleDismiss = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onDismiss();
  };

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNext?.();
  };

  const handlePrimaryAction = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    primaryAction?.onPress();
  };

  const tooltipPosition = getTooltipPosition();

  const IconComponent = {
    info: Info,
    lightbulb: Lightbulb,
    zap: Zap,
  }[icon];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Highlight target area */}
        {targetPosition && showPulse && (
          <Animated.View
            style={[
              styles.highlight,
              pulseStyle,
              {
                top: targetPosition.y - 8,
                left: targetPosition.x - 8,
                width: targetPosition.width + 16,
                height: targetPosition.height + 16,
              },
            ]}
          />
        )}

        {/* Tooltip */}
        <Animated.View
          entering={BounceIn.duration(400)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.tooltipContainer,
            {
              top: tooltipPosition.top,
              left: Math.max(
                spacing.md,
                Math.min(
                  tooltipPosition.left,
                  SCREEN_WIDTH - tooltipLayout.width - spacing.md
                )
              ),
            },
          ]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setTooltipLayout({ width, height });
          }}
        >
          <BlurView intensity={80} tint="dark" style={styles.tooltipBlur}>
            <View style={styles.tooltipContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <IconComponent size={20} color={colors.accent.blue} />
                </View>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Dismiss tooltip"
                  accessibilityRole="button"
                >
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Description */}
              <Text style={styles.description}>{description}</Text>

              {/* Actions */}
              <View style={styles.actions}>
                {primaryAction && (
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={handlePrimaryAction}
                    activeOpacity={0.8}
                    accessibilityLabel={primaryAction.label}
                    accessibilityRole="button"
                  >
                    <Text style={styles.primaryActionText}>
                      {primaryAction.label}
                    </Text>
                  </TouchableOpacity>
                )}

                {onNext && (
                  <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    accessibilityLabel="Next tip"
                    accessibilityRole="button"
                  >
                    <Text style={styles.nextButtonText}>Next</Text>
                    <ChevronRight size={16} color={colors.accent.blue} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  highlight: {
    position: 'absolute',
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.accent.blue,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  tooltipContainer: {
    position: 'absolute',
    maxWidth: 320,
    zIndex: 1000,
  },
  tooltipBlur: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...shadows.lg,
  },
  tooltipContent: {
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  primaryActionButton: {
    backgroundColor: colors.accent.blue,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  primaryActionText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.blue,
  },
  nextButtonText: {
    ...typography.body,
    color: colors.accent.blue,
    fontWeight: '500',
  },
});
