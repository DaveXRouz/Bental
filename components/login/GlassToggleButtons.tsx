import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography } from '@/constants/theme';

interface GlassToggleButtonsProps {
  options: string[];
  selected: number;
  onSelect: (index: number) => void;
}

export function GlassToggleButtons({ options, selected, onSelect }: GlassToggleButtonsProps) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(selected * 100, {
      damping: 20,
      stiffness: 150,
      mass: 0.8,
    });
  }, [selected]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: `${translateX.value}%`,
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.indicator, indicatorStyle, { width: `${100 / options.length}%` }]}>
        <LinearGradient
          colors={['rgba(200, 200, 200, 0.2)', 'rgba(180, 180, 180, 0.15)']}
          style={styles.indicatorGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {options.map((option, index) => {
        const isSelected = selected === index;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              onSelect(index);
            }}
            style={styles.option}
            accessibilityLabel={option}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Animated.Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}
            >
              {option}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 20, 22, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 3,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 3,
    left: 0,
    bottom: 3,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  indicatorGradient: {
    flex: 1,
  },
  option: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
  },
  optionTextSelected: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
});
