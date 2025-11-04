import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography } from '@/constants/theme';

interface PasswordStrengthMeterProps {
  password: string;
  showDetails?: boolean;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function PasswordStrengthMeter({ password, showDetails = false }: PasswordStrengthMeterProps) {
  const calculateStrength = (pwd: string): StrengthResult => {
    const checks = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    let score = 0;
    let label = 'Weak';
    let color = '#EF4444';

    if (passedChecks >= 5 && pwd.length >= 12) {
      score = 100;
      label = 'Excellent';
      color = '#10B981';
    } else if (passedChecks >= 4 && pwd.length >= 10) {
      score = 75;
      label = 'Strong';
      color = '#10B981';
    } else if (passedChecks >= 3 && pwd.length >= 8) {
      score = 50;
      label = 'Fair';
      color = '#F59E0B';
    } else if (pwd.length >= 6) {
      score = 25;
      label = 'Weak';
      color = '#EF4444';
    }

    return { score, label, color, checks };
  };

  const strength = calculateStrength(password);

  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(`${strength.score}%`, { duration: 300 }),
  }));

  if (!password) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.container}>
      {/* Strength Bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <Animated.View style={[styles.barFill, barStyle]}>
            <LinearGradient
              colors={[strength.color, `${strength.color}CC`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={[styles.label, { color: strength.color }]}>{strength.label}</Text>
      </View>

      {/* Details */}
      {showDetails && (
        <View style={styles.detailsContainer}>
          <CheckItem
            checked={strength.checks.length}
            label="At least 8 characters"
          />
          <CheckItem
            checked={strength.checks.uppercase}
            label="One uppercase letter"
          />
          <CheckItem
            checked={strength.checks.lowercase}
            label="One lowercase letter"
          />
          <CheckItem
            checked={strength.checks.number}
            label="One number"
          />
          <CheckItem
            checked={strength.checks.special}
            label="One special character"
          />
        </View>
      )}
    </Animated.View>
  );
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={styles.checkItem}>
      {checked ? (
        <CheckCircle2 size={14} color="#10B981" strokeWidth={2.5} />
      ) : (
        <XCircle size={14} color="rgba(255, 255, 255, 0.3)" strokeWidth={2} />
      )}
      <Text style={[styles.checkLabel, checked && styles.checkLabelChecked]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    minWidth: 60,
    textAlign: 'right',
  },
  detailsContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs - 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkLabelChecked: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
