import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Bell,
  BarChart3,
  Bot,
  Newspaper,
  Eye,
  Target,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  features?: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'welcome',
    title: 'Welcome to Your Trading Platform',
    description: 'A premium platform designed for modern traders. Track markets, automate strategies, and grow your portfolio.',
    icon: Sparkles,
    color: colors.blue,
    features: [
      'Real-time market data',
      'AI-powered trading bots',
      'Advanced analytics',
      'Secure transactions',
    ],
  },
  {
    key: 'markets',
    title: 'Track Your Favorite Assets',
    description: 'Monitor stocks, crypto, forex, and commodities. Create watchlists and get instant price updates.',
    icon: TrendingUp,
    color: colors.success,
    features: [
      'Multi-asset support',
      'Real-time quotes',
      'Interactive charts',
      'Custom watchlists',
    ],
  },
  {
    key: 'bots',
    title: 'Automated Trading Bots',
    description: 'Subscribe to professional trading strategies. Let AI handle the trades while you focus on strategy.',
    icon: Bot,
    color: colors.purple,
    features: [
      '8+ proven strategies',
      'Backtested results',
      'Risk management',
      '24/7 automation',
    ],
  },
  {
    key: 'alerts',
    title: 'Stay Informed',
    description: 'Set price alerts and never miss an opportunity. Get notified about important market movements.',
    icon: Bell,
    color: colors.warning,
    features: [
      'Price alerts',
      'News notifications',
      'Bot updates',
      'Portfolio changes',
    ],
  },
  {
    key: 'portfolio',
    title: 'Monitor Your Performance',
    description: 'Comprehensive portfolio analytics with real-time tracking and historical performance data.',
    icon: BarChart3,
    color: colors.blue,
    features: [
      'Real-time tracking',
      'Performance charts',
      'Asset allocation',
      'P&L analysis',
    ],
  },
];

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingModal({ visible, onComplete, onSkip }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { width, isMobile } = useResponsive();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming((currentStep + 1) / ONBOARDING_STEPS.length, {
      duration: 300,
    });
  }, [currentStep]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const handleNext = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSkip();
  };

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.container,
            { maxWidth: isMobile ? width - spacing.xl : 500 },
          ]}
        >
          <LinearGradient
            colors={['rgba(26, 26, 28, 0.95)', 'rgba(20, 20, 22, 0.98)']}
            style={styles.card}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleSkip}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
            >
              <X size={24} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    progressStyle,
                    { backgroundColor: step.color },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {currentStep + 1} / {ONBOARDING_STEPS.length}
              </Text>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Icon */}
              <Animated.View
                key={step.key}
                entering={SlideInRight.duration(300)}
                style={[styles.iconContainer, { backgroundColor: `${step.color}20` }]}
              >
                <Icon size={48} color={step.color} />
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>{step.title}</Text>

              {/* Description */}
              <Text style={styles.description}>{step.description}</Text>

              {/* Features */}
              {step.features && (
                <View style={styles.featuresContainer}>
                  {step.features.map((feature, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeIn.delay(index * 100)}
                      style={styles.featureItem}
                    >
                      <CheckCircle2 size={20} color={step.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </ScrollView>

            {/* Navigation */}
            <View style={styles.navigation}>
              {currentStep > 0 ? (
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={handlePrevious}
                  accessibilityLabel="Previous step"
                  accessibilityRole="button"
                >
                  <ChevronLeft size={24} color={colors.text} />
                  <Text style={styles.navButtonText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.navButton} />
              )}

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: step.color }]}
                onPress={handleNext}
                activeOpacity={0.8}
                accessibilityLabel={
                  currentStep === ONBOARDING_STEPS.length - 1
                    ? 'Get started'
                    : 'Next step'
                }
                accessibilityRole="button"
              >
                <Text style={styles.primaryButtonText}>
                  {currentStep === ONBOARDING_STEPS.length - 1
                    ? "Let's Get Started"
                    : 'Next'}
                </Text>
                <ChevronRight size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: spacing.lg,
  },
  container: {
    width: '100%',
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl + spacing.md,
    paddingBottom: spacing.lg,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  featuresContainer: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  navButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  primaryButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
