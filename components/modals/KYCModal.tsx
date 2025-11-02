import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { X } from 'lucide-react-native';
import { GlassCard, GlassButton } from '@/components/glass';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Typography, Spacing } from '@/constants/theme';

interface KYCModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type RiskTolerance = 'conservative' | 'moderate' | 'aggressive' | 'very_aggressive';
type InvestmentExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';
type TimeHorizon = 'short' | 'medium' | 'long';

export function KYCModal({ visible, onClose, onComplete }: KYCModalProps) {
  const { colors, theme } = useThemeStore();
  const { session } = useAuth();
  const isDark = theme === 'dark';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('moderate');
  const [experience, setExperience] = useState<InvestmentExperience>('beginner');
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizon>('medium');
  const [incomeRange, setIncomeRange] = useState('50000-100000');
  const [netWorthRange, setNetWorthRange] = useState('100000-500000');
  const [objectives, setObjectives] = useState<string[]>(['growth']);

  const totalSteps = 4;

  const toggleObjective = (obj: string) => {
    if (objectives.includes(obj)) {
      setObjectives(objectives.filter(o => o !== obj));
    } else {
      setObjectives([...objectives, obj]);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('suitability_assessments')
        .insert({
          user_id: session?.user?.id,
          risk_tolerance: riskTolerance,
          investment_experience: experience,
          investment_horizon: timeHorizon,
          annual_income_range: incomeRange,
          net_worth_range: netWorthRange,
          investment_objectives: objectives,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      onComplete();
    } catch (err) {
      console.error('Error submitting KYC:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Risk Tolerance
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        How comfortable are you with investment risk?
      </Text>

      <View style={styles.optionsContainer}>
        {[
          { value: 'conservative', label: 'Conservative', desc: 'Minimize risk, steady returns' },
          { value: 'moderate', label: 'Moderate', desc: 'Balance risk and return' },
          { value: 'aggressive', label: 'Aggressive', desc: 'Higher risk for higher returns' },
          { value: 'very_aggressive', label: 'Very Aggressive', desc: 'Maximum returns, accept high volatility' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setRiskTolerance(option.value as RiskTolerance)}
            style={styles.optionButton}
          >
            <GlassCard
              style={
                riskTolerance === option.value
                  ? [styles.optionCard, styles.optionCardSelected]
                  : styles.optionCard
              }
            >
              <View style={styles.radioOuter}>
                {riskTolerance === option.value && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  {option.desc}
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Investment Experience
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        What is your investment experience level?
      </Text>

      <View style={styles.optionsContainer}>
        {[
          { value: 'beginner', label: 'Beginner', desc: 'New to investing' },
          { value: 'intermediate', label: 'Intermediate', desc: '1-3 years experience' },
          { value: 'advanced', label: 'Advanced', desc: '3-5 years experience' },
          { value: 'expert', label: 'Expert', desc: '5+ years experience' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setExperience(option.value as InvestmentExperience)}
            style={styles.optionButton}
          >
            <GlassCard
              style={
                experience === option.value
                  ? [styles.optionCard, styles.optionCardSelected]
                  : styles.optionCard
              }
            >
              <View style={styles.radioOuter}>
                {experience === option.value && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  {option.desc}
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Investment Goals
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Select all that apply
      </Text>

      <View style={styles.optionsContainer}>
        {[
          { value: 'growth', label: 'Capital Growth' },
          { value: 'income', label: 'Regular Income' },
          { value: 'preservation', label: 'Capital Preservation' },
          { value: 'retirement', label: 'Retirement Planning' },
          { value: 'tax', label: 'Tax Efficiency' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => toggleObjective(option.value)}
            style={styles.optionButton}
          >
            <GlassCard
              style={
                objectives.includes(option.value)
                  ? [styles.optionCard, styles.optionCardSelected]
                  : styles.optionCard
              }
            >
              <View style={styles.checkbox}>
                {objectives.includes(option.value) && (
                  <View style={[styles.checkmark, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <Text style={[styles.optionLabel, { color: colors.text }]}>
                {option.label}
              </Text>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>
        Financial Profile
      </Text>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Help us understand your financial situation
      </Text>

      <View style={styles.optionsContainer}>
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Time Horizon
        </Text>
        {[
          { value: 'short', label: 'Short Term', desc: '0-3 years' },
          { value: 'medium', label: 'Medium Term', desc: '3-7 years' },
          { value: 'long', label: 'Long Term', desc: '7+ years' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setTimeHorizon(option.value as TimeHorizon)}
            style={styles.optionButton}
          >
            <GlassCard
              style={
                timeHorizon === option.value
                  ? [styles.optionCard, styles.optionCardSelected]
                  : styles.optionCard
              }
            >
              <View style={styles.radioOuter}>
                {timeHorizon === option.value && (
                  <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                  {option.desc}
                </Text>
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#0A1F1C' : '#E8F5F1' }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Suitability Assessment
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Step {step} of {totalSteps}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(step / totalSteps) * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <GlassButton
              title="Back"
              onPress={() => setStep(step - 1)}
              variant="secondary"
              style={styles.footerButton}
            />
          )}
          <GlassButton
            title={step === totalSteps ? 'Complete' : 'Next'}
            onPress={() => {
              if (step === totalSteps) {
                handleSubmit();
              } else {
                setStep(step + 1);
              }
            }}
            variant="primary"
            disabled={loading}
            style={styles.footerButton}
            fullWidth={step === 1}
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: Spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  stepContent: {
    paddingBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: Spacing.sm,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    marginBottom: Spacing.xs,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  optionCardSelected: {
    borderColor: 'rgba(79,209,197,0.5)',
    borderWidth: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkmark: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
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
  footerButtonFull: {
    flex: 1,
  },
});
