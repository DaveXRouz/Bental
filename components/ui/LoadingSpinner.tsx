import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
}

export function LoadingSpinner({ size = 'large', color = '#3B82F6', message }: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

export function FullScreenLoader({ message }: { message?: string }) {
  return (
    <View style={styles.fullScreenContainer}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <BlurView intensity={80} tint="dark" style={styles.loaderCard}>
        <ActivityIndicator size="large" color="#3B82F6" />
        {message && <Text style={styles.fullScreenMessage}>{message}</Text>}
      </BlurView>
    </View>
  );
}

export function ButtonSpinner({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <View style={styles.buttonSpinner}>
      <ActivityIndicator size="small" color={color} />
    </View>
  );
}

export function InlineSpinner({ color = '#3B82F6' }: { color?: string }) {
  return <ActivityIndicator size="small" color={color} style={styles.inlineSpinner} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderCard: {
    paddingVertical: 32,
    paddingHorizontal: 48,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
  },
  fullScreenMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  buttonSpinner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineSpinner: {
    marginHorizontal: 8,
  },
});
