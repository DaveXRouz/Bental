import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  TrendingUp,
  Clock,
  Command,
  ArrowRight,
} from 'lucide-react-native';
import { colors, radius, spacing } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { NAV_ITEMS, DockItemId } from '@/constants/nav-items';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchResult {
  id: string;
  type: 'stock' | 'feature' | 'action' | 'recent';
  title: string;
  subtitle?: string;
  icon: any;
  color: string;
  onPress: () => void;
}

interface GlobalSearchProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearch({ visible, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (visible) {
      setQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (query.length > 0) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = (searchQuery: string) => {
    const lowerQuery = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    Object.values(NAV_ITEMS).forEach((item) => {
      if (
        item.label.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery)
      ) {
        searchResults.push({
          id: item.id,
          type: 'feature',
          title: item.label,
          subtitle: item.description,
          icon: item.icon,
          color: item.iconColor,
          onPress: () => {
            router.push(item.route as any);
            onClose();
          },
        });
      }
    });

    if (searchQuery.match(/^[A-Z]{1,5}$/)) {
      searchResults.unshift({
        id: `stock-${searchQuery}`,
        type: 'stock',
        title: searchQuery.toUpperCase(),
        subtitle: 'View stock details',
        icon: TrendingUp,
        color: '#3B82F6',
        onPress: () => {
          router.push(`/stock/${searchQuery.toUpperCase()}` as any);
          onClose();
        },
      });
    }

    setResults(searchResults);
  };

  const renderResult = ({ item }: { item: SearchResult }) => {
    const Icon = item.icon;

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <BlurView intensity={20} tint="dark" style={styles.resultItemBlur}>
          <View style={[styles.resultIcon, { backgroundColor: `${item.color}20` }]}>
            <Icon size={20} color={item.color} />
          </View>

          <View style={styles.resultText}>
            <Text style={styles.resultTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.resultSubtitle}>{item.subtitle}</Text>
            )}
          </View>

          <ArrowRight size={18} color={colors.textMuted} />
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </BlurView>

        <View style={styles.container}>
          <BlurView intensity={80} tint="dark" style={styles.content}>
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.2)']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.header}>
              <View style={styles.searchBox}>
                <Search size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search stocks, features..."
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  returnKeyType="search"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <X size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                query.length > 0 ? (
                  <View style={styles.emptyState}>
                    <Search size={48} color={colors.textMuted} />
                    <Text style={styles.emptyText}>No results found</Text>
                  </View>
                ) : (
                  <View style={styles.hint}>
                    <Command size={16} color={colors.textMuted} />
                    <Text style={styles.hintText}>
                      Search for stocks (AAPL, TSLA) or features
                    </Text>
                  </View>
                )
              }
            />
          </BlurView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  container: {
    maxHeight: '80%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  content: {
    borderWidth: 1,
    borderColor: GLASS.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxxl,
    justifyContent: 'center',
  },
  hintText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  resultsList: {
    padding: spacing.lg,
  },
  resultItem: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  resultItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: GLASS.border,
    borderRadius: radius.lg,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  resultSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
});
