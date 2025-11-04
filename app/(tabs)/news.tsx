import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { Newspaper, TrendingUp, TrendingDown, Minus, X } from 'lucide-react-native';
import { useNews } from '@/hooks/useNews';
import { GlassCard } from '@/components/glass/GlassCard';
import { Screen } from '@/components/layout/Screen';

export default function NewsScreen() {
  const { articles, categories, loading, refresh } = useNews();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const filteredArticles = selectedCategory
    ? articles.filter(a => a.category_id === selectedCategory)
    : articles;

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp size={16} color="#10b981" />;
      case 'negative': return <TrendingDown size={16} color="#ef4444" />;
      default: return <Minus size={16} color="#94a3b8" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Newspaper size={32} color="#3b82f6" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Market News</Text>
          <Text style={styles.subtitle}>{filteredArticles.length} articles</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />}
      >
        {filteredArticles.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Newspaper size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No news articles</Text>
            <Text style={styles.emptyText}>Check back later for market updates</Text>
          </GlassCard>
        ) : (
          <>
            {filteredArticles.filter(a => a.featured).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>FEATURED</Text>
                {filteredArticles.filter(a => a.featured).map((article) => (
                  <TouchableOpacity key={article.id} onPress={() => setSelectedArticle(article)}>
                    <GlassCard style={styles.featuredCard}>
                      <View style={styles.articleHeader}>
                        <View style={[styles.sentimentBadge, { backgroundColor: `${getSentimentColor(article.sentiment)}20` }]}>
                          {getSentimentIcon(article.sentiment)}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.featuredTitle}>{article.title}</Text>
                          {article.summary && (
                            <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.articleFooter}>
                        <Text style={styles.articleSource}>{article.source || 'Market News'}</Text>
                        <Text style={styles.articleDate}>
                          {new Date(article.published_at || article.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {article.symbols && article.symbols.length > 0 && (
                        <View style={styles.symbolsRow}>
                          {article.symbols.slice(0, 3).map((symbol: string) => (
                            <View key={symbol} style={styles.symbolChip}>
                              <Text style={styles.symbolText}>{symbol}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </GlassCard>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>LATEST NEWS</Text>
              {filteredArticles.filter(a => !a.featured).map((article) => (
                <TouchableOpacity key={article.id} onPress={() => setSelectedArticle(article)}>
                  <GlassCard style={styles.articleCard}>
                    <View style={styles.articleHeader}>
                      <View style={[styles.sentimentBadge, { backgroundColor: `${getSentimentColor(article.sentiment)}20` }]}>
                        {getSentimentIcon(article.sentiment)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.articleTitle}>{article.title}</Text>
                        {article.summary && (
                          <Text style={styles.articleSummary} numberOfLines={1}>{article.summary}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.articleFooter}>
                      <Text style={styles.articleSource}>{article.source || 'Market News'}</Text>
                      <Text style={styles.articleDate}>
                        {new Date(article.published_at || article.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={!!selectedArticle} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.modalHeaderTop}>
                  {selectedArticle?.sentiment && (
                    <View style={[styles.sentimentBadge, { backgroundColor: `${getSentimentColor(selectedArticle.sentiment)}20` }]}>
                      {getSentimentIcon(selectedArticle.sentiment)}
                    </View>
                  )}
                  <Text style={styles.modalSource}>{selectedArticle?.source || 'Market News'}</Text>
                </View>
                <Text style={styles.modalTitle}>{selectedArticle?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedArticle(null)} style={styles.closeButton}>
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedArticle?.summary && (
                <Text style={styles.modalSummary}>{selectedArticle.summary}</Text>
              )}
              {selectedArticle?.content && (
                <Text style={styles.modalText}>{selectedArticle.content}</Text>
              )}
              {selectedArticle?.symbols && selectedArticle.symbols.length > 0 && (
                <View style={styles.relatedSymbols}>
                  <Text style={styles.relatedTitle}>Related Stocks</Text>
                  <View style={styles.symbolsRow}>
                    {selectedArticle.symbols.map((symbol: string) => (
                      <View key={symbol} style={styles.symbolChip}>
                        <Text style={styles.symbolText}>{symbol}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              <Text style={styles.modalDate}>
                Published {new Date(selectedArticle?.published_at || selectedArticle?.created_at).toLocaleString()}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8' },
  categoriesScroll: { maxHeight: 60 },
  categoriesContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(51, 65, 85, 0.6)', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#3b82f6' },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  categoryTextActive: { color: '#fff' },
  content: { flex: 1, padding: 20 },
  emptyCard: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 12 },
  featuredCard: { marginBottom: 16, padding: 20 },
  featuredTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, lineHeight: 28 },
  articleCard: { marginBottom: 12, padding: 16 },
  articleHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  sentimentBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  articleTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6, lineHeight: 22 },
  articleSummary: { fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  articleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  articleSource: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
  articleDate: { fontSize: 12, color: '#64748b' },
  symbolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  symbolChip: { backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  symbolText: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', padding: 24, borderBottomWidth: 1, borderBottomColor: '#334155' },
  modalHeaderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalSource: { fontSize: 14, fontWeight: '600', color: '#3b82f6', marginLeft: 8 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', lineHeight: 32 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 24 },
  modalSummary: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginBottom: 20, lineHeight: 24 },
  modalText: { fontSize: 15, color: '#cbd5e1', lineHeight: 24, marginBottom: 20 },
  relatedSymbols: { marginVertical: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#334155' },
  relatedTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 12 },
  modalDate: { fontSize: 12, color: '#64748b', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
});
