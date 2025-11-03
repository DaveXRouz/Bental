import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, spacing, typography, radius, shadows, ACCENT_GRADIENT } from '@/constants/theme';

interface SegmentedProps {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
}

export function Segmented({ options, selected, onSelect }: SegmentedProps) {
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(selected * 50 + '%', {
            duration: 120,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={styles.option}
          onPress={() => onSelect(index)}
          activeOpacity={0.7}
          accessibilityLabel={`Select ${option}`}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === index }}
        >
          <Text
            style={[
              styles.optionText,
              selected === index && styles.optionTextActive,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    width: '50%',
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    zIndex: 0,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    minHeight: 44,
  },
  optionText: {
    fontSize: typography.size.md, fontWeight: "500",
    color: colors.textSecondary,
    textAlign: 'center',
  },
  optionTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
});
