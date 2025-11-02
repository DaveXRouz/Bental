import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NewsArticle } from '@/services/news/types';
import { NewsItem } from './NewsItem';
import { GlassSkeleton } from '@/components/glass/GlassSkeleton';
import { AccessibleInfiniteScroll } from '@/components/accessible/AccessibleInfiniteScroll';
import { Spacing } from '@/constants/theme';

interface NewsListProps {
  articles: NewsArticle[];
  loading?: boolean;
  onArticlePress: (article: NewsArticle) => void;
  limit?: number;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  usePagination?: boolean;
}

export function NewsList({
  articles,
  loading = false,
  onArticlePress,
  limit,
  onLoadMore,
  hasMore = false,
  usePagination = false,
}: NewsListProps) {
  if (loading && articles.length === 0) {
    return (
      <View style={styles.container}>
        {[...Array(3)].map((_, i) => (
          <GlassSkeleton key={i} height={88} style={styles.skeleton} />
        ))}
      </View>
    );
  }

  const displayArticles = limit ? articles.slice(0, limit) : articles;

  if (!onLoadMore || displayArticles.length === 0) {
    return (
      <View style={styles.container}>
        {displayArticles.map((article) => (
          <NewsItem
            key={article.id}
            article={article}
            onPress={onArticlePress}
          />
        ))}
      </View>
    );
  }

  return (
    <AccessibleInfiniteScroll
      data={displayArticles}
      renderItem={(article, index) => (
        <NewsItem
          key={article.id}
          article={article}
          onPress={onArticlePress}
        />
      )}
      keyExtractor={(article, index) => article.id || `news-${index}`}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      loading={loading}
      usePagination={usePagination}
      itemsPerPage={10}
      emptyMessage="No news articles available"
      loadingMessage="Loading more articles"
      accessibilityLabel="News articles list"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  skeleton: {
    marginBottom: Spacing.sm,
  },
});
