import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography } from '@/constants/theme';

interface Glass3DButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function Glass3DButton({
  title,
  onPress,
  disabled = false,
  loading = false,
}: Glass3DButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <LinearGradient
          colors={
            disabled || loading
              ? ['rgba(120, 120, 120, 0.3)', 'rgba(100, 100, 100, 0.3)']
              : ['rgba(200, 200, 200, 0.15)', 'rgba(180, 180, 180, 0.12)', 'rgba(160, 160, 160, 0.1)']
          }
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.content}>
            {loading ? (
              <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.9)" />
            ) : (
              <Text
                style={[
                  styles.text,
                  (disabled || loading) && styles.textDisabled,
                ]}
              >
                {title}
              </Text>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  touchable: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    letterSpacing: 0.5,
  },
  textDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
