import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { WifiOff } from 'lucide-react-native';
import { colors, typography, radius } from '@/constants/theme';

const S = 8;

export function ConnectionStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      setIsOnline(navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(200)}
      style={styles.banner}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="You are currently offline"
      accessibilityLiveRegion="polite"
    >
      <WifiOff size={16} color={colors.white} strokeWidth={2.5} />
      <Text style={styles.text}>You are offline. Some features may be limited.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S * 1.5,
    backgroundColor: '#F59E0B',
    paddingVertical: S * 1.5,
    paddingHorizontal: S * 2,
    marginHorizontal: S * 2,
    marginBottom: S * 2,
    borderRadius: radius.md,
  },
  text: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.white,
  },
});
