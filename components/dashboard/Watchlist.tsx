import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Plus, X, TrendingUp, TrendingDown, Star } from 'lucide-react-native';
import { colors, Spacing, Typography } from '@/constants/theme';
import { formatCurrency, safePercentage } from '@/utils/formatting';
import { AccessibleCarousel } from '@/components/accessible/AccessibleCarousel';
import { TouchableOpacity } from 'react-native';

interface WatchlistItem {
  id: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
}

interface Props {
  items: WatchlistItem[];
  onAdd: (symbol: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onItemPress?: (symbol: string) => void;
}

export function Watchlist({ items, onAdd, onRemove, onItemPress }: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newSymbol.trim()) return;

    setLoading(true);
    try {
      await onAdd(newSymbol.toUpperCase().trim());
      setNewSymbol('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWatchlistItem = (item: WatchlistItem) => {
    const isPositive = item.price_change_24h >= 0;
    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemSymbol}>{item.symbol}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item.id)}
            accessible={true}
            accessibilityLabel={`Remove ${item.symbol} from watchlist`}
            accessibilityRole="button"
            accessibilityHint="Double tap to remove this stock from your watchlist"
          >
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemPrice}>
          {formatCurrency(item.current_price, 2)}
        </Text>
        <View style={styles.itemChange}>
          {isPositive ? (
            <TrendingUp size={14} color="#10B981" />
          ) : (
            <TrendingDown size={14} color="#EF4444" />
          )}
          <Text style={[styles.itemChangeText, isPositive ? styles.positive : styles.negative]}>
            {isPositive ? '+' : ''}{safePercentage(item.price_change_24h)}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <BlurView intensity={15} tint="dark" style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={styles.titleContainer}
              accessible={true}
              accessibilityRole="header"
            >
              <Star size={20} color={colors.white} fill={colors.white} />
              <Text style={styles.title}>Watchlist</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Add stock to watchlist"
              accessibilityRole="button"
              accessibilityHint="Opens dialog to add a new stock symbol"
            >
              <Plus size={18} color={colors.white} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState} accessible={true}>
              <Text style={styles.emptyText}>No symbols in watchlist</Text>
              <Text style={styles.emptySubtext}>Tap Add to track stocks and crypto</Text>
            </View>
          ) : (
            <AccessibleCarousel
              data={items}
              renderItem={renderWatchlistItem}
              keyExtractor={(item) => item.id}
              itemWidth={140}
              gap={12}
              showPagination={true}
              showNavButtons={items.length > 1}
              accessibilityLabel="Watchlist stocks carousel"
              accessibilityHint="Swipe left or right to browse your watchlist stocks, or use navigation buttons"
              onItemPress={onItemPress ? (item) => onItemPress(item.symbol) : undefined}
            />
          )}
        </View>
      </BlurView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
        statusBarTranslucent
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
          accessible={false}
        >
          <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} accessible={false}>
              <View
                style={styles.modalContent}
                accessible={true}
                accessibilityRole="none"
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={styles.modalTitle}
                    accessible={true}
                    accessibilityRole="header"
                  >
                    Add to Watchlist
                  </Text>
                  <TouchableOpacity
                    style={styles.modalClose}
                    onPress={() => setShowAddModal(false)}
                    accessible={true}
                    accessibilityLabel="Close dialog"
                    accessibilityRole="button"
                  >
                    <X size={24} color={colors.white} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Enter symbol (e.g., AAPL, BTC)"
                  placeholderTextColor={colors.textMuted}
                  value={newSymbol}
                  onChangeText={setNewSymbol}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                  accessible={true}
                  accessibilityLabel="Stock symbol input"
                  accessibilityHint="Enter a stock ticker symbol like AAPL or BTC"
                />

                <TouchableOpacity
                  title={loading ? 'Adding...' : 'Add Symbol'}
                  onPress={handleAdd}
                  loading={loading}
                  disabled={loading || !newSymbol.trim()}
                  accessibilityLabel="Add symbol to watchlist"
                  accessibilityHint="Adds the entered stock symbol to your watchlist"
                  fullWidth={true}
                  hapticFeedback={true}
                />
              </View>
            </TouchableOpacity>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    minHeight: 44,
    minWidth: 44,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
  },
  item: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemSymbol: {
    fontSize: 16,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  removeButton: {
    padding: 8,
    minWidth: 30,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: Typography.weight.bold,
    color: colors.white,
    marginBottom: 8,
  },
  itemChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemChangeText: {
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
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
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  modalClose: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    minHeight: 48,
  },
});
