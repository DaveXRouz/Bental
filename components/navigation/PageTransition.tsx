import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface PageTransitionProps {
  children: React.ReactNode;
  type?: 'fade' | 'slide' | 'scale' | 'flip';
  direction?: 'left' | 'right' | 'up' | 'down';
}

export function PageTransition({
  children,
  type = 'slide',
  direction = 'right',
}: PageTransitionProps) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(direction === 'left' ? -50 : direction === 'right' ? 50 : 0);
  const translateY = useSharedValue(direction === 'up' ? -50 : direction === 'down' ? 50 : 0);
  const scale = useSharedValue(0.9);
  const rotateY = useSharedValue(90);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });

    if (type === 'slide') {
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
      });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 150,
      });
    }

    if (type === 'scale') {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 180,
      });
    }

    if (type === 'flip') {
      rotateY.value = withSpring(0, {
        damping: 18,
        stiffness: 120,
      });
    }
  }, [type]);

  const animatedStyle = useAnimatedStyle(() => {
    const baseStyle: any = {
      opacity: opacity.value,
    };

    if (type === 'slide') {
      baseStyle.transform = [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ];
    }

    if (type === 'scale') {
      baseStyle.transform = [
        { scale: scale.value },
      ];
    }

    if (type === 'flip') {
      baseStyle.transform = [
        {
          rotateY: `${interpolate(
            rotateY.value,
            [0, 90],
            [0, 90]
          )}deg`,
        },
      ];
    }

    return baseStyle;
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
