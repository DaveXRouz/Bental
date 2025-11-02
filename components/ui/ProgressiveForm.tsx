import { useState, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/constants/theme';
import { GLASS } from '@/constants/glass';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Step {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  validate?: () => boolean | Promise<boolean>;
  canSkip?: boolean;
}

interface ProgressiveFormProps {
  steps: Step[];
  onComplete: () => void;
  onCancel?: () => void;
  showProgress?: boolean;
  allowBackNavigation?: boolean;
}

export function ProgressiveForm({
  steps,
  onComplete,
  onCancel,
  showProgress = true,
  allowBackNavigation = true,
}: ProgressiveFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const goToStep = async (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;

    const direction = stepIndex > currentStep ? 1 : -1;

    opacity.value = withTiming(0, { duration: 150 });
    translateX.value = withSpring(-direction * 20, {
      damping: 20,
      stiffness: 90,
    });

    setTimeout(() => {
      setCurrentStep(stepIndex);
      translateX.value = direction * 20;
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      opacity.value = withTiming(1, { duration: 150 });
    }, 150);
  };

  const handleNext = async () => {
    const step = steps[currentStep];

    if (step.validate) {
      setIsValidating(true);
      const isValid = await step.validate();
      setIsValidating(false);

      if (!isValid) return;
    }

    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0 && allowBackNavigation) {
      goToStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (steps[currentStep].canSkip) {
      if (currentStep === steps.length - 1) {
        onComplete();
      } else {
        goToStep(currentStep + 1);
      }
    }
  };

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <View style={styles.container}>
      {showProgress && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.stepCounter}>
              Step {currentStep + 1} of {steps.length}
            </Text>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <View style={styles.stepsIndicator}>
            {steps.map((_, index) => {
              const isCompleted = completedSteps.has(index);
              const isCurrent = index === currentStep;
              const isPast = index < currentStep;

              return (
                <View
                  key={index}
                  style={[
                    styles.stepDot,
                    (isCurrent || isPast) && styles.stepDotActive,
                    isCompleted && styles.stepDotCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text style={styles.stepDotText}>{index + 1}</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.contentSection}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          {step.subtitle && (
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          )}
        </View>

        <Animated.View style={[styles.stepContent, animatedStyle]}>
          {step.content}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.navigationButtons}>
          {!isFirstStep && allowBackNavigation && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <BlurView intensity={40} tint="dark" style={styles.backButtonInner}>
                <ChevronLeft size={20} color={colors.text} />
                <Text style={styles.backButtonText}>Back</Text>
              </BlurView>
            </TouchableOpacity>
          )}

          {step.canSkip && !isLastStep && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              isFirstStep && styles.nextButtonFullWidth,
            ]}
            onPress={handleNext}
            disabled={isValidating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isValidating
                  ? ['#6B7280', '#4B5563']
                  : isLastStep
                  ? ['#10B981', '#059669']
                  : ['#3B82F6', '#2563EB']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              {isValidating ? (
                <Text style={styles.nextButtonText}>Validating...</Text>
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {isLastStep ? 'Complete' : 'Continue'}
                  </Text>
                  {!isLastStep && (
                    <ChevronRight size={20} color="#FFFFFF" />
                  )}
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {onCancel && isFirstStep && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressSection: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  stepDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  contentSection: {
    flex: 1,
    padding: spacing.lg,
  },
  stepHeader: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  stepContent: {
    flex: 1,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  backButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  skipButton: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  nextButtonFullWidth: {
    flex: 1,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
