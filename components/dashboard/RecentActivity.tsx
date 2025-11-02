import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing, shadows } from '@/constants/theme';
import { GLASS } from '@/constants/glass';
import { formatCompactCurrency } from '@/utils/formatting';

const S = 8;

interface Trade {
  id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  executed_at: string;
}

interface RecentActivityProps {
  userId: string | undefined;
}

export function RecentActivity({ userId }: RecentActivityProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchRecentTrades();
  }, [userId]);

  const fetchRecentTrades = async () => {
    if (!userId) return;

    try {
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId);

      if (accounts && accounts.length > 0) {
        const accountIds = accounts.map(a => a.id);

        const { data: tradesData } = await supabase
          .from('trades')
          .select('id, symbol, trade_type, quantity, price, executed_at')
          .in('account_id', accountIds)
          .order('executed_at', { ascending: false })
          .limit(5);

        setTrades(tradesData || []);
      }
    } catch (error) {
      console.error('[RecentActivity] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading || trades.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={18} color="#3B82F6" />
          <Text style={styles.title}>Recent Activity</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
          <ArrowRight size={14} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.activities}>
        {trades.map((trade) => {
          const isBuy = trade.trade_type === 'buy';
          const totalAmount = trade.quantity * trade.price;

          return (
            <TouchableOpacity key={trade.id} activeOpacity={0.8}>
              <BlurView intensity={60} tint="dark" style={styles.activityCard}>
                <LinearGradient
                  colors={isBuy ? ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.04)'] : ['rgba(239,68,68,0.08)', 'rgba(239,68,68,0.04)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.activityContent}>
                  <View style={styles.activityLeft}>
                    <View style={[styles.activityIcon, isBuy ? styles.buyIcon : styles.sellIcon]}>
                      {isBuy ? (
                        <TrendingUp size={16} color="#10B981" />
                      ) : (
                        <TrendingDown size={16} color="#EF4444" />
                      )}
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activitySymbol}>{trade.symbol}</Text>
                      <Text style={styles.activityDetails}>
                        {trade.trade_type.toUpperCase()} • {trade.quantity} shares
                      </Text>
                    </View>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>
                      {isBuy ? '-' : '+'}{formatCompactCurrency(totalAmount)}
                    </Text>
                    <Text style={styles.activityTime}>{formatTime(trade.executed_at)}</Text>
                  </View>
                </View>
              </BlurView>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: S * 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  activities: {
    gap: 10,
  },
  activityCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyIcon: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  sellIcon: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  activityInfo: {
    flex: 1,
  },
  activitySymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
