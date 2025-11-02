import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { CheckCircle2, Calendar, MessageCircle } from 'lucide-react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { theme, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { MotiView } from 'moti';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

interface GlassHeroProps {
  name?: string;
  role?: string;
  imageUrl?: string;
  verified?: boolean;
  onScheduleCall?: () => void;
  onMessage?: () => void;
}

export function GlassHero({
  name = 'Avraham Bental',
  role = 'Senior Financial Advisor',
  imageUrl,
  verified = true,
  onScheduleCall,
  onMessage,
}: GlassHeroProps) {
  const { colors } = useThemeStore();

  const defaultImage = 'https://images.pexels.com/photos/5668838/pexels-photo-5668838.jpeg?auto=compress&cs=tinysrgb&w=400';
  const calendlyUrl = Constants.expoConfig?.extra?.calendlyUrl ||
                      process.env.EXPO_PUBLIC_CALENDLY_URL ||
                      'https://calendly.com';

  const handleScheduleCall = async () => {
    if (onScheduleCall) {
      onScheduleCall();
    } else if (Platform.OS === 'web') {
      window.open(calendlyUrl, '_blank');
    } else {
      await WebBrowser.openBrowserAsync(calendlyUrl);
    }
  };

  const handleMessage = () => {
    if (onMessage) {
      onMessage();
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
    >
      <BlurView intensity={20} style={styles.container} tint="dark">
        <View style={[styles.inner, { borderColor: colors.border }]}>
          <View style={styles.leftSection}>
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 100 }}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUrl || defaultImage }}
                  style={styles.image}
                  resizeMode="cover"
                />
                {verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: theme.colors.surface }]}>
                    <CheckCircle2 size={16} color={theme.colors.success} strokeWidth={2.5} />
                  </View>
                )}
              </View>
            </MotiView>

            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
              <Text style={[styles.role, { color: colors.textSecondary }]}>{role}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={handleScheduleCall}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: colors.accent,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Calendar size={18} color={theme.colors.background} strokeWidth={2} />
              <Text style={[styles.primaryButtonText, { color: theme.colors.background }]}>
                Schedule Call
              </Text>
            </Pressable>

            <Pressable
              onPress={handleMessage}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <MessageCircle size={18} color={colors.text} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </BlurView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  inner: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.family.semibold,
    letterSpacing: -0.3,
  },
  role: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.semibold,
    letterSpacing: -0.2,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
});
