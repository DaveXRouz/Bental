import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function NewsManagement() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [articlesRes, categoriesRes] = await Promise.all([
      supabase.from('news_articles').select('*, news_categories(name)').order('created_at', { ascending: false }),
      supabase.from('news_categories').select('*').order('display_order'),
    ]);
    if (articlesRes.data) setArticles(articlesRes.data);
    if (categoriesRes.data) setCategories(categoriesRes.data);
    setLoading(false);
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('news_articles')
      .update({ published: !currentStatus, published_at: !currentStatus ? new Date().toISOString() : null })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', `Article ${!currentStatus ? 'published' : 'unpublished'}`);
      fetchData();
    }
  };

  const deleteArticle = async (id: string) => {
    Alert.alert('Confirm Delete', 'Delete this article?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('news_articles').delete().eq('id', id);
          if (error) Alert.alert('Error', error.message);
          else fetchData();
        },
      },
    ]);
  };

  const createArticle = () => {
    setEditingArticle({
      title: '',
      summary: '',
      content: '',
      source: '',
      source_url: '',
      image_url: '',
      sentiment: 'neutral',
      category_id: categories[0]?.id,
    });
    setShowModal(true);
  };

  const saveArticle = async () => {
    if (!editingArticle.title) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    const { error } = editingArticle.id
      ? await supabase.from('news_articles').update(editingArticle).eq('id', editingArticle.id)
      : await supabase.from('news_articles').insert([editingArticle]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Article saved');
      setShowModal(false);
      fetchData();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>News Management</Text>
          <Text style={styles.headerSubtitle}>{articles.length} articles</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={createArticle}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {articles.map((article) => (
          <View key={article.id} style={styles.articleCard}>
            <View style={styles.articleHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleMeta}>
                  {article.news_categories?.name} • {new Date(article.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.statusBadge, article.published && styles.statusPublished]}>
                <Text style={styles.statusText}>{article.published ? 'Published' : 'Draft'}</Text>
              </View>
            </View>
            {article.summary && <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>}
            <View style={styles.articleActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => togglePublish(article.id, article.published)}
              >
                {article.published ? <EyeOff size={16} color="#f59e0b" /> : <Eye size={16} color="#10b981" />}
                <Text style={[styles.actionText, { color: article.published ? '#f59e0b' : '#10b981' }]}>
                  {article.published ? 'Unpublish' : 'Publish'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => { setEditingArticle(article); setShowModal(true); }}
              >
                <Edit2 size={16} color="#3b82f6" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteArticle(article.id)}
              >
                <Trash2 size={16} color="#ef4444" />
                <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingArticle?.id ? 'Edit' : 'Create'} Article</Text>
            <ScrollView>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={editingArticle?.title || ''}
                onChangeText={(text) => setEditingArticle({ ...editingArticle, title: text })}
                placeholder="Article title"
                placeholderTextColor="#64748b"
              />
              <Text style={styles.label}>Summary</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={editingArticle?.summary || ''}
                onChangeText={(text) => setEditingArticle({ ...editingArticle, summary: text })}
                placeholder="Brief summary"
                placeholderTextColor="#64748b"
                multiline
              />
              <Text style={styles.label}>Content</Text>
              <TextInput
                style={[styles.input, { height: 120 }]}
                value={editingArticle?.content || ''}
                onChangeText={(text) => setEditingArticle({ ...editingArticle, content: text })}
                placeholder="Full article content"
                placeholderTextColor="#64748b"
                multiline
              />
              <Text style={styles.label}>Source URL</Text>
              <TextInput
                style={styles.input}
                value={editingArticle?.source_url || ''}
                onChangeText={(text) => setEditingArticle({ ...editingArticle, source_url: text })}
                placeholder="https://..."
                placeholderTextColor="#64748b"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={saveArticle}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#334155', gap: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  articleCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  articleHeader: { flexDirection: 'row', marginBottom: 12 },
  articleTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  articleMeta: { fontSize: 12, color: '#64748b' },
  statusBadge: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPublished: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  articleSummary: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  articleActions: { flexDirection: 'row', gap: 8 },
  actionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  actionText: { fontSize: 12, fontWeight: '500', color: '#3b82f6' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  modalButtonCancel: { backgroundColor: '#334155' },
  modalButtonSave: { backgroundColor: '#3b82f6' },
  modalButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalButtonTextCancel: { fontSize: 15, fontWeight: '600', color: '#94a3b8' },
});
