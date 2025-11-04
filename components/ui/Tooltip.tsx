import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { spacing, typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface TooltipProps {
  content: string;
  size?: number;
}

export function Tooltip({ content, size = 16 }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.trigger}
        accessibilityLabel="Show information"
        accessibilityRole="button"
        accessibilityHint={content}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <HelpCircle size={size} color="rgba(255, 255, 255, 0.5)" strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.tooltipContainer}
          >
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>{content}</Text>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  tooltipContainer: {
    maxWidth: width - 64,
  },
  tooltip: {
    backgroundColor: 'rgba(26, 26, 28, 0.95)',
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  tooltipText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(200, 200, 200, 0.15)',
    borderRadius: 8,
  },
  closeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
