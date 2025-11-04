import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { spacing, typography, radius } from '@/constants/theme';

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
          translateX: withSpring(translateValue, {
            damping: 18,
            stiffness: 180,
          }),
        },
      ],
    };
  });

  const getOptionStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const isSelected = selected === index;
      return {
        opacity: withTiming(isSelected ? 1 : 0.6, { duration: 200 }),
        transform: [
          {
            scale: withSpring(isSelected ? 1 : 0.96, {
              damping: 15,
              stiffness: 150,
            }),
          },
        ],
      };
    });
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={40} tint="dark" style={styles.backgroundBlur}>
        <LinearGradient
          colors={['rgba(30, 30, 40, 0.75)', 'rgba(20, 20, 30, 0.85)']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </BlurView>

      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${100 / options.length}%`,
          },
          indicatorStyle,
        ]}
      >
        <BlurView intensity={80} tint="light" style={styles.indicatorBlur}>
          <LinearGradient
            colors={[
              'rgba(220, 220, 225, 0.18)',
              'rgba(200, 200, 205, 0.15)',
              'rgba(180, 180, 185, 0.13)'
            ]
            style={styles.indicatorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.indicatorInnerGlow}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.3)',
                'rgba(255, 255, 255, 0.1)',
                'transparent'
              ]}
              style={styles.innerGlowGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          </View>

          <View style={styles.indicatorBorder}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.45)',
                'rgba(220, 220, 220, 0.4)',
                'rgba(200, 200, 200, 0.35)'
              ]
              style={styles.borderGradient}
            />
          </View>
        </BlurView>
      </Animated.View>

      {options.map((option, index) => {
        const animatedStyle = getOptionStyle(index);
        return (
          <TouchableOpacity
            key={option}
            style={styles.option}
            onPress={() => onSelect(index)}
            activeOpacity={0.8}
            accessibilityLabel={`Select ${option}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: selected === index }}
          >
            <Animated.View style={[styles.optionContent, animatedStyle]}>
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
              {selected === index && (
                <View style={styles.textGlow}>
                  <Text
                    style={[styles.optionTextGlow, styles.optionTextActive]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {option}
                  </Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
    height: 48,
    shadowColor: 'rgba(255, 255, 255, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  backgroundBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
  },
  backgroundGradient: {
    flex: 1,
    borderRadius: radius.pill,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
    shadowColor: 'rgba(255, 255, 255, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  indicatorBlur: {
    flex: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  indicatorGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
  },
  indicatorInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: radius.pill,
    borderTopRightRadius: radius.pill,
    overflow: 'hidden',
  },
  innerGlowGradient: {
    flex: 1,
  },
  indicatorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  borderGradient: {
    flex: 1,
    borderRadius: radius.pill,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    minHeight: 40,
  },
  optionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  optionText: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  optionTextActive: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '700',
  },
  textGlow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextGlow: {
    fontSize: typography.size.md,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    opacity: 0.4,
  },
});
