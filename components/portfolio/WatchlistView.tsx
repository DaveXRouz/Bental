import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Plus, X, TrendingUp, TrendingDown, Star, Search } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { colors, Typography } from '@/constants/theme';
import { formatCurrency, safePercentage } from '@/utils/formatting';

const { width } = Dimensions.get('window');

export default function WatchlistView() {
  const { user } = useAuth();
  const { items, addToWatchlist, removeFromWatchlist } = useWatchlist(user?.id);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = async () => {
    if (!newSymbol.trim()) return;

    setLoading(true);
    try {
      await addToWatchlist(newSymbol.toUpperCase().trim());
      setNewSymbol('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.searchContainer}>
          <BlurView intensity={12} tint="dark" style={styles.searchBox}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search symbols..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Add Symbol</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <BlurView intensity={12} tint="dark" style={styles.emptyState}>
            <Star size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching symbols' : 'No symbols in watchlist'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Add symbols to track prices'}
            </Text>
          </BlurView>
        ) : (
          <View style={styles.gridContainer}>
            {filteredItems.map((item) => {
              const isPositive = item.price_change_24h >= 0;
              return (
                <TouchableOpacity key={item.id} activeOpacity={0.7} style={styles.gridItem}>
                  <BlurView intensity={12} tint="dark" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={styles.symbolBadge}>
                        <Text style={styles.symbolText}>{item.symbol}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFromWatchlist(item.id)}
                      >
                        <X size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemContent}>
                      <Text style={styles.itemPrice}>
                        {item.current_price > 0 ? formatCurrency(item.current_price, 2) : '$--'}
                      </Text>
                      <View style={styles.itemChange}>
                        {isPositive ? (
                          <TrendingUp size={12} color="#10B981" />
                        ) : (
                          <TrendingDown size={12} color="#EF4444" />
                        )}
                        <Text style={[styles.itemChangeText, isPositive ? styles.positive : styles.negative]}>
                          {isPositive ? '+' : ''}{safePercentage(item.price_change_24h)}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.itemFooter}>
                      <View style={styles.sparkline}>
                        {[...Array(15)].map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.sparklineBar,
                              {
                                height: Math.random() * 25 + 8,
                                backgroundColor: isPositive
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : 'rgba(239, 68, 68, 0.3)',
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add to Watchlist</Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setShowAddModal(false)}
                >
                  <X size={24} color={colors.white} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Enter a stock ticker symbol or cryptocurrency code.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter symbol (e.g., AAPL, BTC)"
                placeholderTextColor={colors.textMuted}
                value={newSymbol}
                onChangeText={setNewSymbol}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.modalButton, loading && styles.modalButtonDisabled]}
                onPress={handleAdd}
                disabled={loading || !newSymbol.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Adding...' : 'Add to Watchlist'}
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: (width - 60) / 2,
  },
  itemCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  symbolBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  symbolText: {
    fontSize: 13,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  removeButton: {
    padding: 4,
  },
  itemContent: {
    marginBottom: 10,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 6,
  },
  itemChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemChangeText: {
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  itemFooter: {
    marginTop: 8,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 32,
  },
  sparklineBar: {
    flex: 1,
    borderRadius: 2,
  },
  emptyState: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  modalClose: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.white,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
});
