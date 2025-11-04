import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Plus, X, TrendingUp, TrendingDown, Star, Search, Edit2, FolderPlus, Trash2, Save } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useWatchlistGroups, WatchlistGroup } from '@/hooks/useWatchlistGroups';
import { colors, Typography } from '@/constants/theme';
import { formatCurrency, safePercentage } from '@/utils/formatting';

const { width } = Dimensions.get('window');

const GROUP_COLORS = [
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Orange', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Pink', value: '#EC4899' },
];

export default function EnhancedWatchlistView() {
  const { user } = useAuth();
  const { groups, loading, createGroup, updateGroup, deleteGroup, addItemToGroup, removeItemFromGroup, updateItem } = useWatchlistGroups();

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WatchlistGroup | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(GROUP_COLORS[0].value);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    if (groups.length > 0 && !activeGroupId) {
      const defaultGroup = groups.find(g => g.is_default) || groups[0];
      setActiveGroupId(defaultGroup.id);
    }
  }, [groups, activeGroupId]);

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const filteredItems = activeGroup?.items?.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddSymbol = async () => {
    if (!newSymbol.trim() || !activeGroupId) return;

    setModalLoading(true);
    try {
      await addItemToGroup(activeGroupId, {
        symbol: newSymbol.toUpperCase().trim(),
        alert_enabled: false,
        display_order: (activeGroup?.items?.length || 0) + 1,
      });
      setNewSymbol('');
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding symbol:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setModalLoading(true);
    try {
      await createGroup({
        user_id: user?.id,
        name: newGroupName.trim(),
        color: selectedColor,
        display_order: groups.length + 1,
        is_default: groups.length === 0,
      });
      setNewGroupName('');
      setSelectedColor(GROUP_COLORS[0].value);
      setShowGroupModal(false);
      setEditingGroup(null);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    setModalLoading(true);
    try {
      await updateGroup(editingGroup.id, {
        name: newGroupName.trim(),
        color: selectedColor,
      });
      setNewGroupName('');
      setSelectedColor(GROUP_COLORS[0].value);
      setShowGroupModal(false);
      setEditingGroup(null);
    } catch (error) {
      console.error('Error updating group:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (groups.length <= 1) {
      alert('Cannot delete the last group');
      return;
    }

    try {
      await deleteGroup(groupId);
      if (activeGroupId === groupId) {
        const remainingGroup = groups.find(g => g.id !== groupId);
        setActiveGroupId(remainingGroup?.id || null);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const openEditGroup = (group: WatchlistGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setSelectedColor(group.color || GROUP_COLORS[0].value);
    setShowGroupModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading watchlists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Group Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.groupTabs}
        contentContainerStyle={styles.groupTabsContent}
      >
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={[
              styles.groupTab,
              activeGroupId === group.id && styles.groupTabActive,
              { borderBottomColor: group.color || colors.primary },
            ]}
            onPress={() => setActiveGroupId(group.id)}
            onLongPress={() => openEditGroup(group)}
            activeOpacity={0.7}
          >
            <View style={[styles.groupTabDot, { backgroundColor: group.color || colors.primary }]} />
            <Text style={[styles.groupTabText, activeGroupId === group.id && styles.groupTabTextActive]}>
              {group.name}
            </Text>
            <Text style={styles.groupTabCount}>{group.items?.length || 0}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addGroupButton}
          onPress={() => {
            setEditingGroup(null);
            setNewGroupName('');
            setSelectedColor(GROUP_COLORS[0].value);
            setShowGroupModal(true);
          }}
          activeOpacity={0.7}
        >
          <Plus size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Search & Actions */}
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

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={18} color={colors.white} />
            <Text style={styles.actionButtonText}>Add Symbol</Text>
          </TouchableOpacity>

          {activeGroup && !activeGroup.is_default && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteGroup(activeGroup.id)}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Symbols Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <BlurView intensity={12} tint="dark" style={styles.emptyState}>
            <Star size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No matching symbols' : 'No symbols in this group'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Add symbols to track prices'}
            </Text>
          </BlurView>
        ) : (
          <View style={styles.gridContainer}>
            {filteredItems.map((item) => {
              const isPositive = (item as any).price_change_24h >= 0;
              return (
                <TouchableOpacity key={item.id} activeOpacity={0.7} style={styles.gridItem}>
                  <BlurView intensity={12} tint="dark" style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <View style={[styles.symbolBadge, { borderLeftColor: activeGroup?.color || colors.primary }]}>
                        <Text style={styles.symbolText}>{item.symbol}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeItemFromGroup(item.id)}
                      >
                        <X size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemContent}>
                      <Text style={styles.itemPrice}>
                        {(item as any).current_price > 0 ? formatCurrency((item as any).current_price, 2) : '$--'}
                      </Text>
                      <View style={styles.itemChange}>
                        {isPositive ? (
                          <TrendingUp size={12} color="#10B981" />
                        ) : (
                          <TrendingDown size={12} color="#EF4444" />
                        )}
                        <Text style={[styles.itemChangeText, isPositive ? styles.positive : styles.negative]}>
                          {isPositive ? '+' : ''}{safePercentage((item as any).price_change_24h)}%
                        </Text>
                      </View>
                    </View>

                    {item.notes && (
                      <View style={styles.notesContainer}>
                        <Text style={styles.notesText} numberOfLines={2}>{item.notes}</Text>
                      </View>
                    )}
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Symbol Modal */}
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
                <Text style={styles.modalTitle}>Add to {activeGroup?.name}</Text>
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
                style={[styles.modalButton, modalLoading && styles.modalButtonDisabled]}
                onPress={handleAddSymbol}
                disabled={modalLoading || !newSymbol.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>
                  {modalLoading ? 'Adding...' : 'Add Symbol'}
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Create/Edit Group Modal */}
      <Modal
        visible={showGroupModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowGroupModal(false);
          setEditingGroup(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingGroup ? 'Edit Group' : 'Create Group'}
                </Text>
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => {
                    setShowGroupModal(false);
                    setEditingGroup(null);
                  }}
                >
                  <X size={24} color={colors.white} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                {editingGroup ? 'Update group name and color' : 'Create a new watchlist group'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Group name (e.g., Tech Stocks)"
                placeholderTextColor={colors.textMuted}
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />

              <Text style={styles.colorLabel}>Choose Color:</Text>
              <View style={styles.colorGrid}>
                {GROUP_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.value },
                      selectedColor === color.value && styles.colorOptionSelected,
                    ]}
                    onPress={() => setSelectedColor(color.value)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[styles.modalButton, modalLoading && styles.modalButtonDisabled]}
                onPress={editingGroup ? handleUpdateGroup : handleCreateGroup}
                disabled={modalLoading || !newGroupName.trim()}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>
                  {modalLoading ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  groupTabs: {
    maxHeight: 56,
    marginBottom: 16,
  },
  groupTabsContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  groupTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  groupTabActive: {
    borderBottomWidth: 2,
  },
  groupTabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  groupTabText: {
    fontSize: 15,
    fontWeight: Typography.weight.medium,
    color: colors.textMuted,
  },
  groupTabTextActive: {
    color: colors.white,
    fontWeight: Typography.weight.semibold,
  },
  groupTabCount: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  addGroupButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSection: {
    paddingHorizontal: 24,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 14,
    borderRadius: 14,
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionButtonText: {
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
    borderLeftWidth: 3,
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
  notesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  notesText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
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
  colorLabel: {
    fontSize: 14,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: 'rgba(255,255,255,0.6)',
    borderWidth: 3,
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
