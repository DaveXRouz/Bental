import { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, AccessibilityInfo } from 'react-native';
import { colors, Spacing, Typography } from '@/constants/theme';

interface SkipToContentProps {
  targets: {
    id: string;
    label: string;
    ref: React.RefObject<any>;
  }[];
}

/**
 * SkipToContent Component
 *
 * Provides skip navigation links for keyboard and screen reader users
 * Allows users to bypass repetitive content and jump to main sections
 *
 * Usage:
 * ```tsx
 * const mainContentRef = useRef(null);
 * const navigationRef = useRef(null);
 *
 * <SkipToContent
 *   targets={[
 *     { id: 'main', label: 'Skip to main content', ref: mainContentRef },
 *     { id: 'nav', label: 'Skip to navigation', ref: navigationRef },
 *   ]}
 * />
 * ```
 */
export function SkipToContent({ targets }: SkipToContentProps) {
  const handleSkip = (target: { id: string; label: string; ref: React.RefObject<any> }) => {
    if (Platform.OS === 'web') {
      // Web: Use native focus
      const element = target.ref.current;
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Native: Announce and try to focus
      AccessibilityInfo.announceForAccessibility(`Navigated to ${target.label}`);

      if (target.ref.current?.focus) {
        target.ref.current.focus();
      } else if (target.ref.current?.measure) {
        // Scroll to the element if possible
        target.ref.current.measure(
          (x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
            // You could implement scroll logic here if needed
          }
        );
      }
    }
  };

  if (targets.length === 0) return null;

  return (
    <View
      style={styles.container}
      accessible={false}
      accessibilityElementsHidden={false}
    >
      {targets.map((target) => (
        <TouchableOpacity
          key={target.id}
          style={styles.skipLink}
          onPress={() => handleSkip(target)}
          accessible={true}
          accessibilityRole="link"
          accessibilityLabel={target.label}
          accessibilityHint={`Navigates to ${target.label.toLowerCase()}`}
        >
          <Text style={styles.skipText}>{target.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.select({ ios: 44, android: 0, default: 0 }),
    left: 0,
    right: 0,
    zIndex: 10000,
    pointerEvents: 'box-none',
  },
  skipLink: {
    position: 'absolute',
    top: -9999,
    left: Spacing.md,
    backgroundColor: colors.primary || '#0B6E4F',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    // Show on focus (web)
    ...Platform.select({
      web: {
        ':focus': {
          top: Spacing.md,
        },
      },
    }),
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
