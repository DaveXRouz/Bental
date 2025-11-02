import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, X, TrendingUp, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCurrency, formatPercent } from '@/utils/formatting';

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface SearchResult {
  symbol: string;
  company_name: string;
  price?: number;
  change_percent?: number;
}

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const timeoutId = setTimeout(() => {
        searchStocks(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (symbol: string) => {
    try {
      const updated = [symbol, ...recentSearches.filter(s => s !== symbol)].slice(0, MAX_RECENT_SEARCHES);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const searchStocks = async (searchQuery: string) => {
    setIsSearching(true);

    try {
      const { data } = await supabase
        .from('market_quotes')
        .select('symbol, company_name, price, change_percent')
        .or(`symbol.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`)
        .limit(10);

      setResults(data || []);
    } catch (error) {
      console.error('Error searching stocks:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectStock = (symbol: string) => {
    saveRecentSearch(symbol);
    setQuery('');
    setIsFocused(false);
    router.push(`/stock/${symbol}`);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  const showDropdown = isFocused && (query.length > 0 || recentSearches.length > 0);

  return (
    <View style={styles.container}>
      <BlurView intensity={60} tint="dark" style={styles.searchBar}>
        <Search size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.input}
          placeholder="Search stocks..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </BlurView>

      {showDropdown && (
        <BlurView intensity={80} tint="dark" style={styles.dropdown}>
          {query.length === 0 && recentSearches.length > 0 ? (
            <>
              <View style={styles.dropdownHeader}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={styles.dropdownHeaderText}>Recent Searches</Text>
              </View>
              {recentSearches.map(symbol => (
                <TouchableOpacity
                  key={symbol}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectStock(symbol)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentIcon}>
                    <Clock size={16} color={colors.textMuted} />
                  </View>
                  <Text style={styles.dropdownItemSymbol}>{symbol}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : query.length > 0 && results.length > 0 ? (
            results.map(result => {
              const isPositive = (result.change_percent || 0) >= 0;
              return (
                <TouchableOpacity
                  key={result.symbol}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectStock(result.symbol)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultContent}>
                    <View>
                      <Text style={styles.dropdownItemSymbol}>{result.symbol}</Text>
                      <Text style={styles.dropdownItemName}>{result.company_name || result.symbol}</Text>
                    </View>
                    {result.price && (
                      <View style={styles.resultPrice}>
                        <Text style={styles.priceText}>{formatCurrency(result.price)}</Text>
                        {result.change_percent !== undefined && (
                          <Text style={[styles.changeText, isPositive ? styles.positive : styles.negative]}>
                            {isPositive ? '+' : ''}{formatPercent(result.change_percent)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : query.length > 0 && !isSearching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          ) : null}

          {isSearching && (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  dropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 400,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  dropdownHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: GLASS.border,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemSymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownItemName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  resultPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  positive: {
    color: '#10B981',
  },
  negative: {
    color: '#EF4444',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  loadingState: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
