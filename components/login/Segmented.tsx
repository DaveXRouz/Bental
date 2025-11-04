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
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    borderRadius: radius.pill,
    padding: 3,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.25)',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    left: 3,
    bottom: 3,
    width: '50%',
    backgroundColor: '#3a3a3a',
    borderRadius: radius.pill,
    zIndex: 0,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    minHeight: 40,
  },
  optionText: {
    fontSize: typography.size.sm,
    fontWeight: '500',
    color: '#808080',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#e0e0e0',
    fontWeight: '600',
  },
});
