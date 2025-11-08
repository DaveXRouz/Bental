import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { ExternalLink } from 'lucide-react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { NewsArticle } from '@/hooks/useNews';

interface NewsItemProps {
  article: NewsArticle;
  onPress: (article: NewsArticle) => void;
}

export function NewsItem({ article, onPress }: NewsItemProps) {
  const { colors } = useThemeStore();

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable
      onPress={() => onPress(article)}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <BlurView intensity={16} tint="dark" style={[styles.blur, { borderColor: colors.border }]}>
        <View style={styles.content}>
          {article.image_url && (
            <Image
              source={{ uri: article.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          <View style={styles.textContainer}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={2}
            >
              {article.title}
            </Text>
            <View style={styles.meta}>
              <Text style={[styles.source, { color: colors.textSecondary }]}>
                {article.source || 'Unknown Source'}
              </Text>
              <Text style={[styles.dot, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>
                {article.published_at ? timeAgo(article.published_at) : 'Recently'}
              </Text>
            </View>
          </View>
          <ExternalLink size={16} color={colors.textMuted} strokeWidth={2} />
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  blur: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'center',
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.semibold,
    lineHeight: Typography.size.sm * 1.4,
    letterSpacing: -0.2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  source: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dot: {
    fontSize: Typography.size.xs,
  },
  time: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.regular,
  },
});
