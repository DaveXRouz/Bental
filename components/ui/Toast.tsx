import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ type, message, onDismiss, duration = 3000 }: ToastProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 200 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const config = getToastConfig(type);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <BlurView intensity={80} tint="dark" style={styles.toast}>
        <LinearGradient colors={config.gradient} style={StyleSheet.absoluteFill} />
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
            {config.icon}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

function getToastConfig(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircle size={20} color="#10B981" />,
        iconBg: 'rgba(16,185,129,0.15)',
        gradient: ['rgba(16,185,129,0.12)', 'rgba(16,185,129,0.06)'] as const,
      };
    case 'error':
      return {
        icon: <XCircle size={20} color="#EF4444" />,
        iconBg: 'rgba(239,68,68,0.15)',
        gradient: ['rgba(239,68,68,0.12)', 'rgba(239,68,68,0.06)'] as const,
      };
    case 'warning':
      return {
        icon: <AlertCircle size={20} color="#F59E0B" />,
        iconBg: 'rgba(245,158,11,0.15)',
        gradient: ['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.06)'] as const,
      };
    case 'info':
      return {
        icon: <Info size={20} color="#3B82F6" />,
        iconBg: 'rgba(59,130,246,0.15)',
        gradient: ['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.06)'] as const,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 10000,
  },
  toast: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
});
