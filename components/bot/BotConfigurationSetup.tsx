import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Bot,
  Settings,
  Zap,
  Shield,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const THEME = {
  bg: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDBD',
  accentBlue: '#1DA1F2',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.08)',
  profit: '#10B981',
  loss: '#EF4444',
  warning: '#F59E0B',
};

interface BotConfigurationSetupProps {
  userId: string;
  onComplete: () => void;
}

export default function BotConfigurationSetup({ userId, onComplete }: BotConfigurationSetupProps) {
  const [selectedSetup, setSelectedSetup] = useState<'quick' | 'manual' | null>(null);
  const [loading, setLoading] = useState(false);

  const [manualConfig, setManualConfig] = useState({
    allocatedAmount: '10000',
    riskLevel: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
    percent: '100',
    maxDrawdown: '5.0',
    maxPosition: '15.0',
  });

  const handleQuickSetup = async () => {
    setLoading(true);
    try {
      const { data: existingBot } = await supabase
        .from('bots')
        .select('id')
        .eq('name', 'AI Smart Trader')
        .maybeSingle();

      let botId = existingBot?.id;

      if (!botId) {
        const { data: newBot, error: botError } = await supabase
          .from('bots')
          .insert({
            name: 'AI Smart Trader',
            description: 'Advanced AI-powered trading bot using machine learning',
            risk_level: 'medium',
            strategy_type: 'Momentum & Trend Following',
            min_capital: 10000,
            projected_annual_return: 24.5,
            projected_volatility: 12.8,
          })
          .select()
          .single();

        if (botError) throw botError;
        botId = newBot.id;
      }

      const allocatedAmount = 25000;

      const { error: allocationError } = await supabase
        .from('bot_allocations')
        .insert({
          user_id: userId,
          bot_id: botId,
          allocated_amount: allocatedAmount,
          current_value: allocatedAmount,
          total_return: 0,
          total_return_percent: 0,
          status: 'active',
          risk_level: 'moderate',
          percent: 100,
        });

      if (allocationError) throw allocationError;

      const { error: guardrailsError } = await supabase
        .from('bot_guardrails')
        .insert({
          user_id: userId,
          bot_key: 'default',
          max_dd_pct: 5.0,
          max_pos_pct: 15.0,
          trade_freq: 'moderate',
          auto_pause: true,
        });

      if (guardrailsError && guardrailsError.code !== '23505') {
        throw guardrailsError;
      }

      Alert.alert(
        'Success!',
        'Your trading bot has been configured and activated.',
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error: any) {
      console.error('Quick setup error:', error);
      Alert.alert('Error', 'Failed to set up bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSetup = async () => {
    setLoading(true);
    try {
      const allocatedAmount = parseFloat(manualConfig.allocatedAmount);
      const percent = parseFloat(manualConfig.percent);
      const maxDrawdown = parseFloat(manualConfig.maxDrawdown);
      const maxPosition = parseFloat(manualConfig.maxPosition);

      if (isNaN(allocatedAmount) || allocatedAmount < 1000) {
        Alert.alert('Invalid Input', 'Minimum allocation is $1,000');
        setLoading(false);
        return;
      }

      const { data: existingBot } = await supabase
        .from('bots')
        .select('id')
        .eq('name', 'AI Smart Trader')
        .maybeSingle();

      let botId = existingBot?.id;

      if (!botId) {
        const { data: newBot, error: botError } = await supabase
          .from('bots')
          .insert({
            name: 'AI Smart Trader',
            description: 'Advanced AI-powered trading bot',
            risk_level: manualConfig.riskLevel,
            strategy_type: 'Momentum & Trend Following',
            min_capital: 10000,
            projected_annual_return: 24.5,
            projected_volatility: 12.8,
          })
          .select()
          .single();

        if (botError) throw botError;
        botId = newBot.id;
      }

      const { error: allocationError } = await supabase
        .from('bot_allocations')
        .insert({
          user_id: userId,
          bot_id: botId,
          allocated_amount: allocatedAmount,
          current_value: allocatedAmount,
          total_return: 0,
          total_return_percent: 0,
          status: 'paused',
          risk_level: manualConfig.riskLevel,
          percent: percent,
        });

      if (allocationError) throw allocationError;

      const { error: guardrailsError } = await supabase
        .from('bot_guardrails')
        .insert({
          user_id: userId,
          bot_key: 'default',
          max_dd_pct: maxDrawdown,
          max_pos_pct: maxPosition,
          trade_freq: 'moderate',
          auto_pause: true,
        });

      if (guardrailsError && guardrailsError.code !== '23505') {
        throw guardrailsError;
      }

      Alert.alert(
        'Success!',
        'Your trading bot has been configured. You can activate it when ready.',
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error: any) {
      console.error('Manual setup error:', error);
      Alert.alert('Error', 'Failed to configure bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedSetup === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Settings size={48} color={THEME.accentBlue} />
          <Text style={styles.headerTitle}>Configure AI Trading Bot</Text>
          <Text style={styles.headerSubtitle}>
            Choose how you'd like to set up your automated trading assistant
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.optionCard}
            activeOpacity={0.7}
            onPress={() => setSelectedSetup('quick')}
          >
            <BlurView intensity={22} tint="dark" style={styles.optionCardBlur}>
              <View style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  <Zap size={28} color={THEME.accentBlue} />
                </View>
                <View style={styles.optionText}>
                  <View style={styles.optionHeaderRow}>
                    <Text style={styles.optionTitle}>Quick Setup</Text>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>Recommended</Text>
                    </View>
                  </View>
                  <Text style={styles.optionDescription}>
                    Get started in seconds with optimal default settings
                  </Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.profit} />
                      <Text style={styles.featureText}>$25,000 starting allocation</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.profit} />
                      <Text style={styles.featureText}>Moderate risk level</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.profit} />
                      <Text style={styles.featureText}>Automatic guardrails (5% max DD)</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.profit} />
                      <Text style={styles.featureText}>Activated immediately</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color={THEME.textSecondary} />
              </View>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            activeOpacity={0.7}
            onPress={() => setSelectedSetup('manual')}
          >
            <BlurView intensity={22} tint="dark" style={styles.optionCardBlur}>
              <View style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  <Settings size={28} color={THEME.textSecondary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Manual Configuration</Text>
                  <Text style={styles.optionDescription}>
                    Customize every aspect of your bot's behavior
                  </Text>
                  <View style={styles.featureList}>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.textSecondary} />
                      <Text style={styles.featureText}>Set custom allocation amount</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.textSecondary} />
                      <Text style={styles.featureText}>Choose risk level</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.textSecondary} />
                      <Text style={styles.featureText}>Configure guardrails</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <CheckCircle2 size={14} color={THEME.textSecondary} />
                      <Text style={styles.featureText}>Review before activation</Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color={THEME.textSecondary} />
              </View>
            </BlurView>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <AlertCircle size={16} color={THEME.accentBlue} />
            <Text style={styles.infoText}>
              You can adjust these settings anytime from the AI Assistant tab
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (selectedSetup === 'quick') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedSetup(null)}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.setupHeader}>
            <Zap size={40} color={THEME.accentBlue} />
            <Text style={styles.setupTitle}>Quick Setup</Text>
            <Text style={styles.setupSubtitle}>
              Your bot will be configured with these settings:
            </Text>
          </View>

          <BlurView intensity={22} tint="dark" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <DollarSign size={20} color={THEME.profit} />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Starting Allocation</Text>
                  <Text style={styles.summaryValue}>$25,000</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <TrendingUp size={20} color={THEME.accentBlue} />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Risk Level</Text>
                  <Text style={styles.summaryValue}>Moderate</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Shield size={20} color={THEME.warning} />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Max Daily Drawdown</Text>
                  <Text style={styles.summaryValue}>5.0%</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}>
                  <Bot size={20} color={THEME.textSecondary} />
                </View>
                <View style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Bot Status</Text>
                  <Text style={styles.summaryValue}>Active (starts trading)</Text>
                </View>
              </View>
            </View>
          </BlurView>

          <TouchableOpacity
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            activeOpacity={0.7}
            onPress={handleQuickSetup}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>
              {loading ? 'Setting up...' : 'Activate Bot'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (selectedSetup === 'manual') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedSetup(null)}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.setupHeader}>
            <Settings size={40} color={THEME.textSecondary} />
            <Text style={styles.setupTitle}>Manual Configuration</Text>
            <Text style={styles.setupSubtitle}>
              Customize your bot's settings
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Allocation Amount</Text>
            <BlurView intensity={22} tint="dark" style={styles.inputContainer}>
              <DollarSign size={18} color={THEME.textSecondary} />
              <TextInput
                style={styles.input}
                value={manualConfig.allocatedAmount}
                onChangeText={(text) => setManualConfig({ ...manualConfig, allocatedAmount: text })}
                keyboardType="numeric"
                placeholder="10000"
                placeholderTextColor={THEME.textSecondary}
              />
            </BlurView>
            <Text style={styles.formHint}>Minimum: $1,000</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Risk Level</Text>
            <View style={styles.riskOptions}>
              {(['conservative', 'moderate', 'aggressive'] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.riskOption,
                    manualConfig.riskLevel === level && styles.riskOptionSelected,
                  ]}
                  onPress={() => setManualConfig({ ...manualConfig, riskLevel: level })}
                >
                  <Text
                    style={[
                      styles.riskOptionText,
                      manualConfig.riskLevel === level && styles.riskOptionTextSelected,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Max Daily Drawdown (%)</Text>
            <BlurView intensity={22} tint="dark" style={styles.inputContainer}>
              <Shield size={18} color={THEME.textSecondary} />
              <TextInput
                style={styles.input}
                value={manualConfig.maxDrawdown}
                onChangeText={(text) => setManualConfig({ ...manualConfig, maxDrawdown: text })}
                keyboardType="decimal-pad"
                placeholder="5.0"
                placeholderTextColor={THEME.textSecondary}
              />
            </BlurView>
            <Text style={styles.formHint}>Bot auto-pauses at this loss threshold</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Max Position Size (%)</Text>
            <BlurView intensity={22} tint="dark" style={styles.inputContainer}>
              <TrendingUp size={18} color={THEME.textSecondary} />
              <TextInput
                style={styles.input}
                value={manualConfig.maxPosition}
                onChangeText={(text) => setManualConfig({ ...manualConfig, maxPosition: text })}
                keyboardType="decimal-pad"
                placeholder="15.0"
                placeholderTextColor={THEME.textSecondary}
              />
            </BlurView>
            <Text style={styles.formHint}>Maximum % of capital per trade</Text>
          </View>

          <TouchableOpacity
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
            activeOpacity={0.7}
            onPress={handleManualSetup}
            disabled={loading}
          >
            <Text style={styles.actionButtonText}>
              {loading ? 'Configuring...' : 'Configure Bot (Paused)'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>
            Note: Bot will be created in paused state. Activate it from the main page when ready.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  optionCard: {
    marginBottom: 16,
  },
  optionCardBlur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: 'rgba(29,161,242,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.accentBlue,
  },
  optionDescription: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  featureList: {
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(29,161,242,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(29,161,242,0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: THEME.textSecondary,
    lineHeight: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.accentBlue,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  setupTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  setupSubtitle: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    overflow: 'hidden',
    marginBottom: 24,
  },
  summaryContent: {
    padding: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: THEME.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  formHint: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 4,
  },
  riskOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  riskOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: THEME.cardBg,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    alignItems: 'center',
  },
  riskOptionSelected: {
    backgroundColor: 'rgba(29,161,242,0.15)',
    borderColor: THEME.accentBlue,
  },
  riskOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textSecondary,
  },
  riskOptionTextSelected: {
    color: THEME.accentBlue,
  },
  actionButton: {
    backgroundColor: THEME.accentBlue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.textPrimary,
  },
  noteText: {
    fontSize: 12,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 16,
  },
});
