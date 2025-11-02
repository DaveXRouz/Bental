import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GLASS } from '@/constants/glass';
import { colors, glassMorphism, shadows } from '@/constants/theme';
import { useThemeStore } from '@/stores/useThemeStore';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  testID?: string;
  elevated?: boolean;
  variant?: 'default' | 'elevated' | 'subtle';
}

export function GlassCard({ children, style, intensity = 20, testID, elevated = false, variant = 'default' }: GlassCardProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const gradientColors =
    variant === 'elevated'
      ? (['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.08)'] as const)
      : variant === 'subtle'
      ? (['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)'] as const)
      : (['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'] as const);

  return (
    <View style={[styles.container, elevated && shadows.glass3D, style]} testID={testID}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={styles.blur}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={[styles.content, {
            borderColor: variant === 'elevated'
              ? 'rgba(255,255,255,0.18)'
              : variant === 'subtle'
              ? 'rgba(255,255,255,0.08)'
              : 'rgba(255,255,255,0.12)'
          }]}>
            {children}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    flexShrink: 1,
    minWidth: 0,
  },
  blur: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});
