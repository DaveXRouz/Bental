import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native';
import { colors, Spacing, Typography } from '@/constants/theme';

interface AccessibleInfiniteScrollProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  onLoadMore: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
  usePagination?: boolean;
  itemsPerPage?: number;
  emptyMessage?: string;
  loadingMessage?: string;
  accessibilityLabel?: string;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
}

export function AccessibleInfiniteScroll<T>({
  data,
  renderItem,
  keyExtractor,
  onLoadMore,
  onRefresh,
  hasMore,
  loading,
  usePagination = false,
  itemsPerPage = 20,
  emptyMessage = 'No items to display',
  loadingMessage = 'Loading more items',
  accessibilityLabel = 'Scrollable content list',
  ListHeaderComponent,
  ListFooterComponent,
}: AccessibleInfiniteScrollProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const loadingRef = useRef(false);

  const totalPages = usePagination
    ? Math.ceil(data.length / itemsPerPage)
    : 1;

  const visibleData = usePagination
    ? data.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : data;

  const handleLoadMore = useCallback(async () => {
    if (loading || loadingRef.current || !hasMore) return;

    loadingRef.current = true;

    try {
      await onLoadMore();

      AccessibilityInfo.announceForAccessibility(
        `Loaded more items. Total items: ${data.length}`
      );
    } catch (error) {
      console.error('Error loading more:', error);
      AccessibilityInfo.announceForAccessibility(
        'Failed to load more items. Please try again.'
      );
    } finally {
      loadingRef.current = false;
    }
  }, [loading, hasMore, onLoadMore, data.length]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;

    setRefreshing(true);

    try {
      await onRefresh();
      setCurrentPage(0);

      AccessibilityInfo.announceForAccessibility(
        'Content refreshed successfully'
      );
    } catch (error) {
      console.error('Error refreshing:', error);
      AccessibilityInfo.announceForAccessibility(
        'Failed to refresh content. Please try again.'
      );
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

      AccessibilityInfo.announceForAccessibility(
        `Page ${currentPage + 2} of ${totalPages}`
      );
    } else if (hasMore && !loading) {
      handleLoadMore();
    }
  }, [currentPage, totalPages, hasMore, loading, handleLoadMore]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

      AccessibilityInfo.announceForAccessibility(
        `Page ${currentPage} of ${totalPages}`
      );
    }
  }, [currentPage, totalPages]);

  const renderFooter = () => {
    if (usePagination) return null;

    if (loading) {
      return (
        <View style={styles.loadingContainer} accessible={true}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>{loadingMessage}</Text>
        </View>
      );
    }

    if (hasMore) {
      return (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
            accessible={true}
            accessibilityLabel="Load more items"
            accessibilityRole="button"
            accessibilityHint="Loads the next set of items"
          >
            <RefreshCw size={20} color={colors.white} />
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (data.length > 0) {
      return (
        <View style={styles.endContainer} accessible={true}>
          <Text style={styles.endText}>No more items to load</Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer} accessible={true}>
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={visibleData}
        renderItem={({ item, index }) => (
          <View
            accessible={true}
            accessibilityLabel={`Item ${index + 1} of ${visibleData.length}`}
          >
            {renderItem(item, index)}
          </View>
        )}
        keyExtractor={keyExtractor}
        onEndReached={!usePagination ? handleLoadMore : undefined}
        onEndReachedThreshold={0.5}
        onRefresh={onRefresh ? handleRefresh : undefined}
        refreshing={refreshing}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={
          <>
            {renderFooter()}
            {ListFooterComponent}
          </>
        }
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        accessible={false}
        accessibilityLabel={accessibilityLabel}
        showsVerticalScrollIndicator={true}
      />

      {usePagination && totalPages > 1 && (
        <View
          style={styles.paginationContainer}
          accessible={true}
          accessibilityLabel={`Page ${currentPage + 1} of ${totalPages}`}
          accessibilityRole="adjustable"
        >
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 0 && styles.paginationButtonDisabled,
            ]}
            onPress={handlePreviousPage}
            disabled={currentPage === 0}
            accessible={true}
            accessibilityLabel="Previous page"
            accessibilityRole="button"
            accessibilityState={{ disabled: currentPage === 0 }}
          >
            <ChevronLeft
              size={20}
              color={currentPage === 0 ? colors.textMuted : colors.white}
            />
            <Text
              style={[
                styles.paginationButtonText,
                currentPage === 0 && styles.paginationButtonTextDisabled,
              ]}
            >
              Previous
            </Text>
          </TouchableOpacity>

          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Page {currentPage + 1} of {totalPages}
            </Text>
            <Text style={styles.paginationSubtext}>
              {visibleData.length} items
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages - 1 &&
                !hasMore &&
                styles.paginationButtonDisabled,
            ]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages - 1 && !hasMore}
            accessible={true}
            accessibilityLabel={hasMore && currentPage === totalPages - 1 ? 'Load next page' : 'Next page'}
            accessibilityRole="button"
            accessibilityState={{
              disabled: currentPage === totalPages - 1 && !hasMore,
            }}
          >
            <Text
              style={[
                styles.paginationButtonText,
                currentPage === totalPages - 1 &&
                  !hasMore &&
                  styles.paginationButtonTextDisabled,
              ]}
            >
              Next
            </Text>
            <ChevronRight
              size={20}
              color={
                currentPage === totalPages - 1 && !hasMore
                  ? colors.textMuted
                  : colors.white
              }
            />
          </TouchableOpacity>
        </View>
      )}

      <View
        accessible={true}
        accessibilityLiveRegion="polite"
        style={styles.srOnly}
      >
        <Text>
          {usePagination
            ? `Page ${currentPage + 1} of ${totalPages}. Showing ${visibleData.length} items.`
            : `Showing ${data.length} items. ${hasMore ? 'More items available.' : 'All items loaded.'}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  loadMoreContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loadMoreText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  endContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  endText: {
    fontSize: Typography.size.sm,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.size.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  paginationButtonTextDisabled: {
    color: colors.textMuted,
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  paginationSubtext: {
    fontSize: Typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    borderWidth: 0,
  } as any,
});
