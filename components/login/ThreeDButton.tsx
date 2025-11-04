import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface ThreeButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
}

export function ThreeDButton({
  onPress,
  title,
  disabled = false,
  loading = false,
}: ThreeButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      style={styles.container}
    >
      <View style={styles.redLayer} />
      <View style={styles.blueLayer} />
      <View style={[styles.mainButton, (disabled || loading) && styles.mainButtonDisabled]}>
        {loading ? (
          <ActivityIndicator color="#e0e0e0" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    position: 'relative',
    minHeight: 44,
  },
  redLayer: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: 2,
    bottom: 2,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 50, 50, 0.4)',
    zIndex: 1,
  },
  blueLayer: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: -2,
    bottom: -2,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(50, 150, 255, 0.4)',
    zIndex: 2,
  },
  mainButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2a2a2a',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.4)',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  mainButtonDisabled: {
    backgroundColor: '#1a1a1a',
    borderColor: 'rgba(80, 80, 80, 0.3)',
  },
  text: {
    fontSize: typography.size.lg,
    color: '#e0e0e0',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
