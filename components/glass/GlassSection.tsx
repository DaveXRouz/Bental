import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { useThemeStore } from '@/stores/useThemeStore';

interface GlassSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassSection({ title, children, style }: GlassSectionProps) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.divider} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: typography.family.bold,
    color: colors.text,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginBottom: 16,
  },
  content: {
    gap: 12,
  },
});
