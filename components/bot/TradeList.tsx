import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { TrendingUp, TrendingDown, Clock, DollarSign, Shield, Target } from 'lucide-react-native';
import { colors, Typography } from '@/constants/theme';
import { formatCompactCurrency } from '@/utils/formatting';

interface Trade {
  id: string;
  symbol: string;
  direction: 'buy' | 'sell' | 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit?: number;
  quantity: number;
  profitLoss?: number;
  profitLossPercent?: number;
  status: 'open' | 'closed' | 'stopped';
  entryTime: string;
  exitTime?: string;
  durationMinutes?: number;
}

interface TradeListProps {
  trades: Trade[];
  onTradePress: (trade: Trade) => void;
  title?: string;
}

export function TradeList({ trades, onTradePress, title = 'Today\'s Trades' }: TradeListProps) {
  const getDirectionColor = (direction: string) => {
    return direction === 'buy' || direction === 'long' ? '#3B82F6' : '#8B5CF6';
  };

  const getStatusColor = (trade: Trade) => {
    if (trade.status === 'open') return '#6B7280';
    if (trade.profitLoss && trade.profitLoss > 0) return '#10B981';
    return '#EF4444';
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Open';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{trades.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {trades.map((trade) => {
          const isProfit = trade.profitLoss && trade.profitLoss > 0;
          const isClosed = trade.status === 'closed' || trade.status === 'stopped';
          const directionColor = getDirectionColor(trade.direction);

          return (
            <TouchableOpacity
              key={trade.id}
              style={styles.tradeCard}
              onPress={() => onTradePress(trade)}
              activeOpacity={0.7}
            >
              <BlurView intensity={10} tint="dark" style={styles.cardBlur}>
                <View style={styles.cardContent}>
                  <View style={styles.topRow}>
                    <View style={styles.symbolRow}>
                      <View style={[styles.directionBadge, { backgroundColor: `${directionColor}20` }]}>
                        <Text style={[styles.directionText, { color: directionColor }]}>
                          {trade.direction.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.symbol}>{trade.symbol}</Text>
                    </View>

                    {isClosed && trade.profitLoss !== undefined && (
                      <View style={[styles.plBadge, isProfit ? styles.plPositive : styles.plNegative]}>
                        {isProfit ? (
                          <TrendingUp size={14} color="#10B981" />
                        ) : (
                          <TrendingDown size={14} color="#EF4444" />
                        )}
                        <Text style={[styles.plText, isProfit ? styles.plTextPositive : styles.plTextNegative]}>
                          {isProfit ? '+' : ''}{formatCompactCurrency(trade.profitLoss)}
                        </Text>
                      </View>
                    )}

                    {!isClosed && (
                      <View style={styles.openBadge}>
                        <Clock size={12} color="#3B82F6" />
                        <Text style={styles.openText}>Open</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.priceRow}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Entry</Text>
                      <Text style={styles.priceValue}>${trade.entryPrice.toFixed(2)}</Text>
                    </View>

                    {trade.exitPrice && (
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>Exit</Text>
                        <Text style={styles.priceValue}>${trade.exitPrice.toFixed(2)}</Text>
                      </View>
                    )}

                    <View style={styles.priceItem}>
                      <Shield size={12} color="#EF4444" />
                      <Text style={styles.priceLabel}>Stop</Text>
                      <Text style={[styles.priceValue, styles.stopLossText]}>
                        ${trade.stopLoss.toFixed(2)}
                      </Text>
                    </View>

                    {trade.takeProfit && (
                      <View style={styles.priceItem}>
                        <Target size={12} color="#10B981" />
                        <Text style={styles.priceLabel}>Target</Text>
                        <Text style={[styles.priceValue, styles.takeProfitText]}>
                          ${trade.takeProfit.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.bottomRow}>
                    <View style={styles.infoRow}>
                      <Clock size={12} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.infoText}>
                        {formatTime(trade.entryTime)}
                      </Text>
                      {trade.durationMinutes !== undefined && (
                        <Text style={styles.infoText}> • {formatDuration(trade.durationMinutes)}</Text>
                      )}
                    </View>

                    <View style={styles.infoRow}>
                      <DollarSign size={12} color="rgba(255,255,255,0.4)" />
                      <Text style={styles.infoText}>{trade.quantity} units</Text>
                    </View>
                  </View>

                  {isClosed && trade.profitLossPercent !== undefined && (
                    <View style={styles.percentBadge}>
                      <Text style={[styles.percentText, isProfit ? styles.plTextPositive : styles.plTextNegative]}>
                        {isProfit ? '+' : ''}{trade.profitLossPercent.toFixed(2)}%
                      </Text>
                    </View>
                  )}
                </View>
              </BlurView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    color: '#6366F1',
  },
  scrollView: {
    maxHeight: 600,
  },
  listContent: {
    gap: 12,
  },
  tradeCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBlur: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  directionText: {
    fontSize: 11,
    fontWeight: Typography.weight.bold,
  },
  symbol: {
    fontSize: 17,
    fontWeight: Typography.weight.bold,
    color: colors.white,
  },
  plBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  plPositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  plNegative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  plText: {
    fontSize: 14,
    fontWeight: Typography.weight.bold,
  },
  plTextPositive: {
    color: '#10B981',
  },
  plTextNegative: {
    color: '#EF4444',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  openText: {
    fontSize: 12,
    fontWeight: Typography.weight.semibold,
    color: '#3B82F6',
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginRight: 4,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: Typography.weight.semibold,
    color: colors.white,
  },
  stopLossText: {
    color: '#EF4444',
  },
  takeProfitText: {
    color: '#10B981',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  percentBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  percentText: {
    fontSize: 12,
    fontWeight: Typography.weight.bold,
  },
});
