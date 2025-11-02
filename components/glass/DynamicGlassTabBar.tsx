import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { GLASS } from '@/constants/glass';
import { useThemeStore } from '@/stores/useThemeStore';
import { zIndex, layout } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useDockStore } from '@/stores/useDockStore';
import { getNavItem, DockItemId, DEFAULT_DOCK_ITEMS, MIN_DOCK_ITEMS } from '@/constants/nav-items';
import { TabBadge } from './TabBadge';
import { useNotifications } from '@/hooks/useNotifications';

const { width: screenWidth } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TabButtonProps {
  itemId: DockItemId;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  accentColor: string;
  isDark: boolean;
  badgeCount?: number;
}

function TabButton({
  itemId,
  isFocused,
  onPress,
  onLongPress,
  accentColor,
  isDark,
  badgeCount,
}: TabButtonProps) {
  const scale = useSharedValue(1);
  const pillScale = useSharedValue(isFocused ? 1 : 0.95);
  const pillOpacity = useSharedValue(isFocused ? 1 : 0);
  const iconSize = useSharedValue(isFocused ? 26 : 24);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.6);

  useEffect(() => {
    pillScale.value = withSpring(isFocused ? 1 : 0.95, {
      damping: 15,
      stiffness: 200,
    });

    pillOpacity.value = withTiming(isFocused ? 1 : 0, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });

    iconSize.value = withSpring(isFocused ? 26 : 24, {
      damping: 12,
      stiffness: 180,
    });

    labelOpacity.value = withTiming(isFocused ? 1 : 0.6, {
      duration: 200,
    });
  }, [isFocused]);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(
          isFocused
            ? Haptics.ImpactFeedbackStyle.Light
            : Haptics.ImpactFeedbackStyle.Medium
        );
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
    onLongPress();
  };

  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onStart(handleLongPress);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pillScale.value }],
    opacity: pillOpacity.value,
    backgroundColor: isDark ? `${accentColor}30` : `${accentColor}20`,
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const navItem = getNavItem(itemId);
  if (!navItem) return null;

  const Icon = navItem.icon;
  const isSmallScreen = screenWidth < 375;

  return (
    <GestureDetector gesture={longPressGesture}>
      <AnimatedTouchable
        accessibilityRole="tab"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={`${navItem.label} tab`}
        onPress={handlePress}
        style={[styles.tab, animatedButtonStyle]}
        activeOpacity={0.9}
      >
        <Animated.View style={[styles.pill, animatedPillStyle]}>
          <Animated.View style={styles.iconContainer}>
            <Icon
              size={24}
              color={
                isFocused
                  ? accentColor
                  : isDark
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(0,0,0,0.5)'
              }
              strokeWidth={isFocused ? 2.5 : 2}
            />
            {badgeCount && badgeCount > 0 && (
              <TabBadge count={badgeCount} color={accentColor} />
            )}
          </Animated.View>
          <Animated.Text
            style={[
              styles.label,
              isSmallScreen && styles.labelSmall,
              !isFocused && styles.labelInactive,
              {
                color: isFocused
                  ? accentColor
                  : isDark
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(0,0,0,0.5)',
              },
              animatedLabelStyle,
            ]}
            numberOfLines={1}
          >
            {navItem.label}
          </Animated.Text>
        </Animated.View>
      </AnimatedTouchable>
    </GestureDetector>
  );
}

export function DynamicGlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { theme } = useThemeStore();
  const { user } = useAuth();
  const { config, loadConfig, loading } = useDockStore();
  const { unreadCount } = useNotifications(user?.id);
  const [dockModalVisible, setDockModalVisible] = useState(false);
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user?.id) {
      loadConfig(user.id);
    }
  }, [user?.id, loadConfig]);

  const handleLongPress = () => {
    setDockModalVisible(true);
  };

  const getRouteNameForDockItem = (itemId: DockItemId): string | null => {
    const routeMap: Record<DockItemId, string> = {
      home: 'index',
      portfolio: 'portfolio',
      markets: 'markets',
      history: 'history',
      ai: 'ai-assistant',
      deposits: 'more',
      withdrawals: 'more',
      support: 'support',
      documents: 'more',
      connect_bank: 'more',
      notifications: 'more',
      profile: 'profile',
      settings: 'more',
    };

    return routeMap[itemId] || null;
  };

  const dockItems = config && config.items && config.items.length >= MIN_DOCK_ITEMS
    ? config.items
    : DEFAULT_DOCK_ITEMS;

  const visibleDockItems = dockItems.filter((itemId) => {
    const navItem = getNavItem(itemId);
    return navItem !== undefined;
  });

  if (visibleDockItems.length < MIN_DOCK_ITEMS) {
    console.warn('Insufficient dock items, using defaults');
    return (
      <>
        <BlurView
          intensity={50}
          tint={isDark ? 'dark' : 'light'}
          style={styles.container}
        >
          <View style={styles.tabBar}>
            {DEFAULT_DOCK_ITEMS.map((itemId) => {
              const navItem = getNavItem(itemId);
              if (!navItem) return null;

              const routeName = getRouteNameForDockItem(itemId);
              if (!routeName) return null;

              const isFocused = state.routes[state.index]?.name === routeName;
              const accentColor = navItem.iconColor;

              const onPress = () => {
                navigation.navigate(routeName as any);
              };

              return (
                <TabButton
                  key={itemId}
                  itemId={itemId}
                  isFocused={isFocused}
                  onPress={onPress}
                  onLongPress={handleLongPress}
                  accentColor={accentColor}
                  isDark={isDark}
                />
              );
            })}
          </View>
        </BlurView>
      </>
    );
  }

  const getCurrentDockItem = (): DockItemId | null => {
    const currentRoute = state.routes[state.index];
    if (!currentRoute) return null;

    const itemEntry = Object.entries({
      home: 'index',
      portfolio: 'portfolio',
      markets: 'markets',
      history: 'history',
      ai: 'ai-assistant',
      deposits: 'more',
      withdrawals: 'more',
      support: 'support',
      documents: 'more',
      connect_bank: 'more',
      notifications: 'more',
      profile: 'profile',
      settings: 'more',
    }).find(([_, route]) => route === currentRoute.name);

    return itemEntry ? (itemEntry[0] as DockItemId) : null;
  };

  const currentDockItem = getCurrentDockItem();

  return (
    <>
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        style={styles.container}
        accessible={true}
        accessibilityLabel="Main navigation"
      >
        <View style={styles.tabBar} accessibilityRole="tablist">
          {visibleDockItems.map((itemId) => {
            const navItem = getNavItem(itemId);
            if (!navItem) return null;

            const routeName = getRouteNameForDockItem(itemId);
            if (!routeName) return null;

            const isFocused = currentDockItem === itemId;
            const accentColor = navItem.iconColor;

            const onPress = () => {
              const route = state.routes.find((r) => r.name === routeName);

              if (route) {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(routeName);
                }
              } else {
                navigation.navigate(routeName as any);
              }
            };

            const badgeCount =
              navItem.badge === 'notifCount' ? unreadCount : undefined;

            return (
              <TabButton
                key={itemId}
                itemId={itemId}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={handleLongPress}
                accentColor={accentColor}
                isDark={isDark}
                badgeCount={badgeCount}
              />
            );
          })}
        </View>
      </BlurView>
    </>
  );
}

const styles = StyleSheet.create({
  container: Platform.select({
    web: {
      position: 'fixed' as any,
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderTopColor: GLASS.border,
      backgroundColor: 'rgba(10, 10, 10, 0.82)',
      zIndex: zIndex.tabBar,
    },
    default: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      borderTopWidth: 1,
      borderTopColor: GLASS.border,
      backgroundColor: 'transparent',
      zIndex: zIndex.tabBar,
    },
  }),
  tabBar: {
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? layout.tabBar.paddingBottomIOS : layout.tabBar.paddingBottomAndroid,
    paddingTop: 16,
    paddingHorizontal: 16,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    minHeight: layout.tabBar.height,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    maxWidth: 120,
    minHeight: 44,
  },
  iconContainer: {
    position: 'relative',
  },
  pill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
    minHeight: 60,
    minWidth: 68,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    flexShrink: 1,
    marginTop: 2,
  },
  labelInactive: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
  },
  labelSmall: {
    fontSize: 10,
  },
});
