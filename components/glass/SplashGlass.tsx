import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { useThemeStore } from '@/stores/useThemeStore';

export function SplashGlass() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#FFF' }]}>
      <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
        <ActivityIndicator size="large" color="#0B6E4F" />
        <Text style={[styles.text, { color: isDark ? '#FFF' : '#000' }]}>
          Initializing...
        </Text>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blur: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
