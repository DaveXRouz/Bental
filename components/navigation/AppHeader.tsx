import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Search, Bell, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

interface AppHeaderProps {
  title?: string;
  onSearchPress?: () => void;
  showSearch?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
}

export function AppHeader({
  title,
  onSearchPress,
  showSearch = true,
  showProfile = true,
  showNotifications = true,
}: AppHeaderProps) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications(user?.id);

  const handlePress = (action: () => void) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    action();
  };

  return (
    <BlurView intensity={30} tint="dark" style={styles.container}>
      <View style={styles.content}>
        {title && (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {showSearch && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePress(() => onSearchPress?.())}
              accessibilityLabel="Search"
            >
              <Search size={24} color={colors.white} strokeWidth={2} />
            </TouchableOpacity>
          )}

          {showNotifications && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePress(() => {})}
              accessibilityLabel="Notifications"
            >
              <Bell size={24} color={colors.white} strokeWidth={2} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {showProfile && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => handlePress(() => router.push('/(tabs)/profile'))}
              accessibilityLabel="Profile"
            >
              <View style={styles.profileCircle}>
                <User size={20} color={colors.white} strokeWidth={2.5} />
              </View>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: Spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000000',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
});
