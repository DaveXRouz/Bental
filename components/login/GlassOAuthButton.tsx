import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

interface GlassOAuthButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
}

export function GlassOAuthButton({ onPress, icon, label }: GlassOAuthButtonProps) {
  const { width } = useResponsive();
  const isSmallDevice = width < 375;
  const buttonHeight = isSmallDevice ? 44 : 48;
  const fontSize = isSmallDevice ? 13 : 14;
  const iconSize = isSmallDevice ? 18 : 20;
  const styles = createStyles(buttonHeight, fontSize, iconSize);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityLabel={`Sign in with ${label}`}
        accessibilityRole="button"
        style={styles.touchable}
      >
        <LinearGradient
          colors={[
            'rgba(30, 30, 32, 0.7)',
            'rgba(24, 24, 26, 0.8)',
            'rgba(20, 20, 22, 0.85)',
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.content}>
            <View style={styles.iconContainer}>{icon}</View>
            <Text style={styles.label}>{label}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (height: number, fontSize: number, iconSize: number) => StyleSheet.create({
  container: {
    flex: 1,
    height: height,
    borderRadius: height / 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
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
  iconContainer: {
    width: iconSize,
    height: iconSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    fontSize: fontSize,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
});
