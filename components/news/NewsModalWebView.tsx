import { Modal, View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { theme, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { NewsArticle } from '@/services/news/types';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

interface NewsModalWebViewProps {
  visible: boolean;
  article: NewsArticle | null;
  onClose: () => void;
}

export function NewsModalWebView({ visible, article, onClose }: NewsModalWebViewProps) {
  const { colors } = useThemeStore();

  useEffect(() => {
    if (visible && article && Platform.OS !== 'web') {
      WebBrowser.openBrowserAsync(article.url).then(() => {
        onClose();
      });
    }
  }, [visible, article]);

  if (!article) return null;

  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BlurView intensity={24} tint="dark" style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                {article.title}
              </Text>
              <Text style={[styles.headerSource, { color: colors.textSecondary }]}>
                {article.source}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: colors.surfaceElevated,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <X size={20} color={colors.text} strokeWidth={2} />
            </Pressable>
          </View>
        </BlurView>

        <WebView
          source={{ uri: article.url }}
          style={styles.webview}
          startInLoadingState
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.family.semibold,
    letterSpacing: -0.3,
  },
  headerSource: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
  },
});
