import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, X, DollarSign, Repeat, Plus } from 'lucide-react-native';
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
  runOnJS,
} from 'react-native-reanimated';
import { zIndex, layout } from '@/constants/theme';

interface FABAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  onPress: () => void;
}

interface AdvancedFABProps {
  onPress: () => void;
  actions?: FABAction[];
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const defaultActions: FABAction[] = [
  {
    id: 'buy',
    label: 'Buy',
    icon: TrendingUp,
    color: '#10B981',
    onPress: () => console.log('Buy'),
  },
  {
    id: 'sell',
    label: 'Sell',
    icon: TrendingDown,
    color: '#EF4444',
    onPress: () => console.log('Sell'),
  },
  {
    id: 'limit',
    label: 'Limit Order',
    icon: DollarSign,
    color: '#F59E0B',
    onPress: () => console.log('Limit Order'),
  },
  {
    id: 'recurring',
    label: 'Auto-Invest',
    icon: Repeat,
    color: '#8B5CF6',
    onPress: () => console.log('Auto-Invest'),
  },
];

export function AdvancedFAB({ onPress, actions = defaultActions }: AdvancedFABProps) {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(0);
  const rotate = useSharedValue(-90);
  const opacity = useSharedValue(0);
  const iconRotate = useSharedValue(0);

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

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
    }

    setExpanded(!expanded);
    iconRotate.value = withSpring(expanded ? 0 : 135, {
      damping: 12,
      stiffness: 150,
    });
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

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${iconRotate.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {expanded && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <SubActionButton
              key={action.id}
              action={action}
              index={index}
              expanded={expanded}
              onPress={() => {
                action.onPress();
                setExpanded(false);
                iconRotate.value = withSpring(0, {
                  damping: 12,
                  stiffness: 150,
                });
              }}
            />
          ))}
        </View>
      )}

      <Animated.View style={[styles.fabContainer, animatedContainerStyle]}>
        <AnimatedTouchable
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.9}
          style={[styles.touchable, animatedTouchableStyle]}
          accessible={true}
          accessibilityLabel="Quick Trade"
          accessibilityHint="Tap to trade, long press for quick actions"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#10B981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
              {expanded ? (
                <X size={22} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Plus size={26} color="#FFFFFF" strokeWidth={3} />
              )}
            </Animated.View>
          </LinearGradient>
        </AnimatedTouchable>
      </Animated.View>
    </View>
  );
}

function SubActionButton({ action, index, expanded, onPress }: any) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (expanded) {
      const delay = index * 50;
      scale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 12,
          stiffness: 200,
        })
      );
      opacity.value = withDelay(
        delay,
        withTiming(1, {
          duration: 200,
        })
      );
      translateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 15,
          stiffness: 180,
        })
      );
    } else {
      scale.value = withTiming(0, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [expanded]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    onPress();
  };

  const Icon = action.icon;

  return (
    <Animated.View style={[styles.subActionContainer, animatedStyle]}>
      <TouchableOpacity
        style={styles.subAction}
        onPress={handlePress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={action.label}
        accessibilityRole="button"
      >
        <View style={[styles.subActionContent, { backgroundColor: `${action.color}20` }]}>
          <Icon size={20} color={action.color} strokeWidth={2.5} />
        </View>
        <Text style={styles.subActionLabel}>{action.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? layout.fab.bottomOffsetIOS : layout.fab.bottomOffsetAndroid,
    right: 20,
    zIndex: zIndex.fab,
    alignItems: 'flex-end',
    pointerEvents: 'box-none',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    gap: 16,
  },
  subActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subActionContent: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  subActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fabContainer: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  touchable: {
    borderRadius: 30,
    overflow: 'visible',
  },
  gradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
