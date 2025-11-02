import { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

interface FloatingActionButtonProps {
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-90);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      400,
      withSpring(1, {
        damping: 12,
        stiffness: 150,
        mass: 0.8,
      })
    );

    rotate.value = withDelay(
      400,
      withSpring(0, {
        damping: 15,
        stiffness: 180,
      })
    );

    opacity.value = withDelay(
      300,
      withTiming(1, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, []);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
      } catch (e) {}
    }

    scale.value = withSequence(
      withSpring(0.92, { damping: 15, stiffness: 200, mass: 0.8 }),
      withSpring(1.05, { damping: 15, stiffness: 200, mass: 0.8 }),
      withSpring(1, { damping: 15, stiffness: 200, mass: 0.8 })
    );

    onPress();
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        {
          rotate: `${interpolate(
            rotate.value,
            [-90, 0],
            [-90, 0]
          )}deg`
        },
      ],
      opacity: opacity.value,
    };
  });

  const animatedTouchableStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <AnimatedTouchable
        onPress={handlePress}
        activeOpacity={0.9}
        style={[styles.touchable, animatedTouchableStyle]}
        accessible={true}
        accessibilityLabel="Quick Trade"
        accessibilityHint="Opens trade screen to place buy or sell orders"
        accessibilityRole="button"
      >
        <LinearGradient
          colors={['#10B981', '#059669', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.iconContainer}>
            <Zap size={24} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.5} />
          </View>
        </LinearGradient>
      </AnimatedTouchable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 92 : 82,
    right: 20,
    zIndex: 1000,
    elevation: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  touchable: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  gradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
