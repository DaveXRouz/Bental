import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Bell, Globe } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '@/constants/theme';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface GlassHeaderProps {
  title?: string;
  onLanguagePress?: () => void;
  onNotificationPress?: () => void;
  showAvatar?: boolean;
}

export function GlassHeader({
  title,
  onLanguagePress,
  onNotificationPress,
  showAvatar = true,
}: GlassHeaderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const isDark = theme === 'dark';

  return (
    <BlurView
      intensity={24}
      tint="dark"
      style={[styles.container, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          {showAvatar && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          {title && <Text style={styles.title}>{title}</Text>}
        </View>

        <View style={styles.right}>
          {onLanguagePress && (
            <TouchableOpacity onPress={onLanguagePress} style={styles.iconButton}>
              <Globe size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          {onNotificationPress && (
            <TouchableOpacity onPress={onNotificationPress} style={styles.iconButton}>
              <Bell size={22} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  avatarText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: typography.family.semibold,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: typography.family.bold,
    color: colors.text,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
