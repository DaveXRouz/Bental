import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { X, TrendingUp, Shield, DollarSign, Activity } from 'lucide-react-native';
import { GlassCard, GlassButton } from '@/components/glass';
import { Sparkline } from '@/components/ui/Sparkline';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Typography, Spacing } from '@/constants/theme';

interface Bot {
  id: string;
  name: string;
  description: string;
  risk_level: string;
  strategy_type: string;
  min_capital: number;
  projected_annual_return: number;
  projected_volatility: number;
}

interface BotDetailModalProps {
  bot: Bot | null;
  visible: boolean;
  onClose: () => void;
  onAllocate?: (botId: string, amount: number) => void;
}

export function BotDetailModal({ bot, visible, onClose, onAllocate }: BotDetailModalProps) {
  const { colors, theme } = useThemeStore();
  const { session } = useAuth();
  const isDark = theme === 'dark';

  const [allocateAmount, setAllocateAmount] = useState('');
  const [performanceData, setPerformanceData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bot?.id) {
      fetchPerformanceData();
    }
  }, [bot?.id]);

  const fetchPerformanceData = async () => {
    if (!bot) return;

    try {
      const { data } = await supabase
        .from('bot_performance_history')
        .select('value')
        .eq('bot_id', bot.id)
        .order('date', { ascending: true })
        .limit(30);

      if (data) {
        setPerformanceData(data.map(d => Number(d.value)));
      }
    } catch (err) {
      console.error('Error fetching performance:', err);
    }
  };

  const handleAllocate = async () => {
    if (!bot || !allocateAmount || !session?.user?.id) return;

    const amount = parseFloat(allocateAmount);
    if (isNaN(amount) || amount < bot.min_capital) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('bot_allocations')
        .insert({
          user_id: session.user.id,
          bot_id: bot.id,
          allocated_amount: amount,
          current_value: amount,
          status: 'active',
        });

      if (error) throw error;

      if (onAllocate) {
        onAllocate(bot.id, amount);
      }

      setAllocateAmount('');
      onClose();
    } catch (err) {
      console.error('Error allocating to bot:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!bot) return null;

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'high': return '#F97316';
      case 'very_high': return '#EF4444';
      default: return colors.textSecondary;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#0A1F1C' : '#E8F5F1' }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {bot.name}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.performanceCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              30-Day Performance
            </Text>
            {performanceData.length > 0 ? (
              <View style={styles.chartContainer}>
                <Sparkline
                  data={performanceData}
                  height={120}
                  color={colors.primary}
                />
              </View>
            ) : (
              <View style={styles.emptyChart}>
                <Activity size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No performance data yet
                </Text>
              </View>
            )}
          </GlassCard>

          <GlassCard style={styles.detailsCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Strategy Overview
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {bot.description}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(79,209,197,0.15)' }]}>
                  <TrendingUp size={20} color={colors.primary} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Projected Return
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {bot.projected_annual_return}%
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: getRiskColor(bot.risk_level) + '20' }]}>
                  <Shield size={20} color={getRiskColor(bot.risk_level)} />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Risk Level
                </Text>
                <Text style={[styles.statValue, { color: getRiskColor(bot.risk_level) }]}>
                  {bot.risk_level.replace('_', ' ')}
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(249,158,11,0.15)' }]}>
                  <Activity size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Volatility
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {bot.projected_volatility}%
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <DollarSign size={20} color="#10B981" />
                </View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  Min. Capital
                </Text>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  ${bot.min_capital.toLocaleString()}
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.allocationCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Allocate Funds
            </Text>
            <Text style={[styles.minCapitalText, { color: colors.textSecondary }]}>
              Minimum: ${bot.min_capital.toLocaleString()}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter amount"
                placeholderTextColor={colors.textSecondary}
                value={allocateAmount}
                onChangeText={setAllocateAmount}
                keyboardType="numeric"
              />
            </View>

            {allocateAmount && parseFloat(allocateAmount) < bot.min_capital && (
              <Text style={styles.errorText}>
                Amount must be at least ${bot.min_capital.toLocaleString()}
              </Text>
            )}
          </GlassCard>
        </ScrollView>

        <View style={styles.footer}>
          <GlassButton
            title="Cancel"
            onPress={onClose}
          />
          <GlassButton
            title="Allocate"
            onPress={handleAllocate}
            disabled={
              loading ||
              !allocateAmount ||
              parseFloat(allocateAmount) < bot.min_capital
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Playfair-Bold',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  performanceCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.md,
  },
  chartContainer: {
    height: 120,
    marginTop: Spacing.sm,
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: Spacing.sm,
  },
  detailsCard: {
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    width: '47%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  allocationCard: {
    marginBottom: Spacing.md,
  },
  minCapitalText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
