import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
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
  const indicatorStyle = useAnimatedStyle(() => {
    const translateValue = selected * (100 / options.length);
    return {
      transform: [
        {
          translateX: withSpring(`${translateValue}%`, {
            damping: 18,
            stiffness: 180,
          }),
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

      {options.map((option, index) => (
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
          accessibilityState={{ selected: selected === index }}
        >
          <Text style={[styles.optionText, selected === index && styles.optionTextSelected]}>
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
