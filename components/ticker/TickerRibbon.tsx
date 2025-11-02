import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTickerStore } from '@/stores/useTickerStore';
import { colors, spacing, typography } from '@/constants/theme';
import { safePercentage, formatCurrency, safeNumber } from '@/utils/formatting';

const SCROLL_SPEED = 50;

export function TickerRibbon() {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const tickersObject = useTickerStore((state) => state.tickers);
  const tickers = useMemo(
    () => Object.values(tickersObject).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
    [tickersObject]
  );
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tickers.length === 0) return;

    scrollX.setValue(0);

    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -SCREEN_WIDTH * 2,
        duration: SCROLL_SPEED * 1000,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [tickers.length, SCREEN_WIDTH]);

  if (tickers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  const displayTickers = [...tickers, ...tickers, ...tickers];

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.scrollContainer,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        {displayTickers.map((ticker, index) => (
          <TickerItem key={`${ticker.symbol}-${index}`} ticker={ticker} />
        ))}
      </Animated.View>
    </View>
  );
}

interface TickerItemProps {
  ticker: {
    symbol: string;
    price: number;
    changePercent: number;
  };
}

function TickerItem({ ticker }: TickerItemProps) {
  const isPositive = ticker.changePercent >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <View style={styles.tickerItem}>
      <Text style={styles.symbol}>{ticker.symbol}</Text>
      <Icon
        size={14}
        color={isPositive ? colors.success : colors.danger}
        style={styles.icon}
      />
      <Text style={styles.price}>
        {formatCurrency(ticker.price, 2)}
      </Text>
      <Text style={[styles.change, isPositive ? styles.positive : styles.negative]}>
        {isPositive ? '+' : ''}
        {safePercentage(ticker.changePercent, 2)}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    backgroundColor: colors.grey[800],
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[700],
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.xxxl,
    gap: spacing.xs,
  },
  symbol: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.white,
  },
  icon: {
    marginLeft: spacing.xs,
  },
  price: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  change: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.danger,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
