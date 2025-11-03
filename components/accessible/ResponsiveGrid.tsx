import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  minItemWidth?: number;
  accessible?: boolean;
  accessibilityLabel?: string;
}

export function ResponsiveGrid({
  children,
  columns,
  gap = 16,
  minItemWidth = 200,
  accessible = false,
  accessibilityLabel,
}: ResponsiveGridProps) {
  const { width } = useWindowDimensions();

  const getColumns = (): number => {
    if (typeof columns === 'number') {
      return columns;
    }

    if (columns && typeof columns === 'object') {
      if (width >= 1280 && columns.xl) return columns.xl;
      if (width >= 1024 && columns.lg) return columns.lg;
      if (width >= 768 && columns.md) return columns.md;
      if (width >= 640 && columns.sm) return columns.sm;
    }

    return Math.max(1, Math.floor(width / minItemWidth));
  };

  const columnCount = getColumns();
  const childArray = React.Children.toArray(children);

  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < childArray.length; i += columnCount) {
    rows.push(childArray.slice(i, i + columnCount));
  }

  return (
    <View
      style={[styles.grid, { gap }]}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="list"
    >
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={[styles.row, { gap }]}>
          {row.map((child, colIndex) => (
            <View
              key={`${rowIndex}-${colIndex}`}
              style={[
                styles.column,
                {
                  flex: 1,
                  minWidth: minItemWidth,
                  maxWidth: `${100 / columnCount}%`,
                },
              ]}
              accessible={true}
              accessibilityRole="listitem"
            >
              {child}
            </View>
          ))}
          {row.length < columnCount &&
            Array.from({ length: columnCount - row.length }).map((_, index) => (
              <View
                key={`empty-${rowIndex}-${index}`}
                style={[
                  styles.column,
                  {
                    flex: 1,
                    minWidth: minItemWidth,
                    maxWidth: `${100 / columnCount}%`,
                  },
                ]}
              />
            ))}
        </View>
      ))}
    </View>
  );
}

interface MasonryGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  accessible?: boolean;
}

export function MasonryGrid({
  children,
  columns = 2,
  gap = 16,
  accessible = false,
}: MasonryGridProps) {
  const childArray = React.Children.toArray(children);
  const columnsArray: React.ReactNode[][] = Array.from({ length: columns }, () => []);

  childArray.forEach((child, index) => {
    columnsArray[index % columns].push(child);
  });

  return (
    <View style={[styles.masonryGrid, { gap }]} accessible={accessible}>
      {columnsArray.map((column, index) => (
        <View
          key={index}
          style={[styles.masonryColumn, { flex: 1, gap }]}
          accessible={true}
          accessibilityRole="list"
        >
          {column.map((child, childIndex) => (
            <View
              key={childIndex}
              accessible={true}
              accessibilityRole="listitem"
            >
              {child}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    flexWrap: Platform.OS === 'web' ? 'wrap' : 'nowrap',
  },
  column: {
    flexBasis: 0,
    flexGrow: 1,
  },
  masonryGrid: {
    flexDirection: 'row',
    width: '100%',
  },
  masonryColumn: {
    flexDirection: 'column',
  },
});
