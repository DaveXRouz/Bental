import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, PieChart, Bot, MoreHorizontal } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GLASS } from '@/constants/glass';
import { zIndex, layout } from '@/constants/theme';

interface TabItem {
  id: string;
  label: string;
  route: string;
  icon: typeof Home;
  iconColor: string;
}

const FIXED_TABS: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    route: 'index',
    icon: Home,
    iconColor: '#3B82F6',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    route: 'portfolio',
    icon: PieChart,
    iconColor: '#10B981',
  },
  {
    id: 'ai',
    label: 'AI Trading',
    route: 'ai-assistant',
    icon: Bot,
    iconColor: '#8B5CF6',
  },
  {
    id: 'more',
    label: 'More',
    route: 'more',
    icon: MoreHorizontal,
    iconColor: '#64748B',
  },
];

export function FixedBottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (route: string, index: number) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index]?.key || route,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route);
    }
  };

  return (
    <BlurView
      intensity={50}
      tint="dark"
      style={[
        styles.container,
        Platform.select({
          web: { position: 'fixed' as any },
          default: { position: 'absolute' },
        }),
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            paddingBottom:
              Platform.OS === 'ios'
                ? Math.max(insets.bottom, layout.tabBar.paddingBottomIOS)
                : layout.tabBar.paddingBottomAndroid,
          },
        ]}
        accessibilityRole="tablist"
      >
        {FIXED_TABS.map((tab, index) => {
          const isFocused = state.routes[state.index]?.name === tab.route;
          const Icon = tab.icon;

          return (
            <TouchableOpacity
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={`${tab.label} tab`}
              onPress={() => handlePress(tab.route, index)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tabContent,
                  isFocused && [
                    styles.tabContentActive,
                    { backgroundColor: `${tab.iconColor}30` },
                  ],
                ]}
              >
                <Icon
                  size={24}
                  color={isFocused ? tab.iconColor : 'rgba(255,255,255,0.5)'}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.label,
                    isFocused && [styles.labelActive, { color: tab.iconColor }],
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: GLASS.border,
    backgroundColor: 'rgba(10, 10, 10, 0.82)',
    zIndex: zIndex.tabBar,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 16,
    paddingHorizontal: 8,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    minHeight: layout.tabBar.height,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
  },
  tabContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 68,
    gap: 4,
  },
  tabContentActive: {
    transform: [{ scale: 1 }],
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  labelActive: {
    fontSize: 11,
    fontWeight: '700',
  },
});
