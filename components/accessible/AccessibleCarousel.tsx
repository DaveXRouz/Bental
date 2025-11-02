import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
  Dimensions,
  ViewToken,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors, Spacing, Typography } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

interface AccessibleCarouselProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemWidth?: number;
  gap?: number;
  showPagination?: boolean;
  showNavButtons?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onItemPress?: (item: T, index: number) => void;
}

export function AccessibleCarousel<T>({
  data,
  renderItem,
  keyExtractor,
  itemWidth = screenWidth - 40,
  gap = 16,
  showPagination = true,
  showNavButtons = true,
  autoplay = false,
  autoplayInterval = 5000,
  accessibilityLabel = 'Content carousel',
  accessibilityHint = 'Swipe left or right to browse items, or use navigation buttons',
  onItemPress,
}: AccessibleCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalItems = data.length;
  const hasMultipleItems = totalItems > 1;

  const scrollToIndex = useCallback(
    (index: number) => {
      if (!hasMultipleItems) return;

      const validIndex = Math.max(0, Math.min(index, totalItems - 1));

      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
      }

      flatListRef.current?.scrollToIndex({
        index: validIndex,
        animated: true,
      });

      setCurrentIndex(validIndex);

      AccessibilityInfo.announceForAccessibility(
        `Showing item ${validIndex + 1} of ${totalItems}`
      );
    },
    [hasMultipleItems, totalItems]
  );

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalItems;
    scrollToIndex(nextIndex);
  }, [currentIndex, totalItems, scrollToIndex]);

  const handlePrevious = useCallback(() => {
    const prevIndex = currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
    scrollToIndex(prevIndex);
  }, [currentIndex, totalItems, scrollToIndex]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderCarouselItem = ({ item, index }: { item: T; index: number }) => (
    <View
      style={[styles.itemContainer, { width: itemWidth }]}
      accessible={true}
      accessibilityLabel={`Item ${index + 1} of ${totalItems}`}
      accessibilityRole="button"
    >
      <TouchableOpacity
        onPress={() => onItemPress?.(item, index)}
        activeOpacity={onItemPress ? 0.8 : 1}
        disabled={!onItemPress}
        accessibilityLabel={`View details for item ${index + 1}`}
      >
        {renderItem(item, index)}
      </TouchableOpacity>
    </View>
  );

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer} accessible={true}>
        <Text style={styles.emptyText}>No items to display</Text>
      </View>
    );
  }

  return (
    <View
      style={styles.container}
      accessible={false}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.carouselWrapper}>
        {hasMultipleItems && showNavButtons && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={handlePrevious}
            accessible={true}
            accessibilityLabel="Previous item"
            accessibilityRole="button"
            accessibilityHint="Navigates to the previous item in the carousel"
          >
            <ChevronLeft size={24} color={colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderCarouselItem}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={itemWidth + gap}
          decelerationRate="fast"
          contentContainerStyle={[styles.listContainer, { gap }]}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: itemWidth,
            offset: (itemWidth + gap) * index,
            index,
          })}
          accessible={false}
          accessibilityLabel={accessibilityHint}
        />

        {hasMultipleItems && showNavButtons && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={handleNext}
            accessible={true}
            accessibilityLabel="Next item"
            accessibilityRole="button"
            accessibilityHint="Navigates to the next item in the carousel"
          >
            <ChevronRight size={24} color={colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      {hasMultipleItems && showPagination && (
        <View
          style={styles.pagination}
          accessible={true}
          accessibilityLabel={`Page ${currentIndex + 1} of ${totalItems}`}
          accessibilityRole="adjustable"
        >
          {data.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive,
              ]}
              onPress={() => scrollToIndex(index)}
              accessible={true}
              accessibilityLabel={`Go to item ${index + 1}`}
              accessibilityRole="button"
              accessibilityState={{ selected: index === currentIndex }}
            />
          ))}
        </View>
      )}

      <View
        accessible={true}
        accessibilityLiveRegion="polite"
        accessibilityLabel={`Viewing item ${currentIndex + 1} of ${totalItems}`}
        style={styles.srOnly}
      >
        <Text>Current: {currentIndex + 1} / {totalItems}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  carouselWrapper: {
    position: 'relative',
  },
  listContainer: {
    paddingHorizontal: Spacing.xl,
  },
  itemContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  navButtonLeft: {
    left: 0,
  },
  navButtonRight: {
    right: 0,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: colors.white,
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.size.md,
    color: colors.textMuted,
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
