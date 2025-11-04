import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface OnboardingStep {
  step_key: string;
  title: string;
  description: string | null;
  screen: string | null;
  order_index: number;
  required: boolean;
  category: string;
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  completed: boolean;
  current_step: string | null;
  completed_steps: string[];
  skipped: boolean;
  started_at: string;
  completed_at: string | null;
  last_seen_step: string | null;
  last_interaction_at: string;
}

export function useOnboarding() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch onboarding steps and progress
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchOnboardingData();
  }, [user]);

  const fetchOnboardingData = async () => {
    if (!user) return;

    try {
      // Fetch steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('onboarding_steps')
        .select('*')
        .order('order_index');

      if (stepsError) throw stepsError;
      setSteps(stepsData || []);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progressError) throw progressError;

      if (progressData) {
        setProgress(progressData);
        // Show onboarding if not completed or skipped
        setShowOnboarding(!progressData.completed && !progressData.skipped);
      } else {
        // Initialize onboarding for new user
        const { data: newProgress, error: initError } = await supabase
          .from('user_onboarding')
          .insert({ user_id: user.id, current_step: 'welcome' })
          .select()
          .single();

        if (initError) throw initError;
        setProgress(newProgress);
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = useCallback(
    async (stepKey: string) => {
      if (!user) return { success: false, error: 'User not authenticated' };

      try {
        const { error } = await supabase.rpc('complete_onboarding_step', {
          p_user_id: user.id,
          p_step_key: stepKey,
        });

        if (error) throw error;

        // Refresh progress
        await fetchOnboardingData();

        return { success: true };
      } catch (error: any) {
        console.error('Error completing step:', error);
        return { success: false, error: error.message };
      }
    },
    [user]
  );

  const skipOnboarding = useCallback(async () => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase.rpc('skip_onboarding', {
        p_user_id: user.id,
      });

      if (error) throw error;

      setShowOnboarding(false);
      await fetchOnboardingData();

      return { success: true };
    } catch (error: any) {
      console.error('Error skipping onboarding:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const completeOnboarding = useCallback(async () => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowOnboarding(false);
      await fetchOnboardingData();

      return { success: true };
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const resetOnboarding = useCallback(async () => {
    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          completed: false,
          completed_at: null,
          current_step: 'welcome',
          completed_steps: [],
          skipped: false,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowOnboarding(true);
      await fetchOnboardingData();

      return { success: true };
    } catch (error: any) {
      console.error('Error resetting onboarding:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const getStepProgress = useCallback(() => {
    if (!progress || !steps.length) return { current: 0, total: 0, percent: 0 };

    const completedCount = progress.completed_steps?.length || 0;
    const totalSteps = steps.filter(s => s.required).length;
    const percent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

    return {
      current: completedCount,
      total: totalSteps,
      percent: Math.round(percent),
    };
  }, [progress, steps]);

  const isStepCompleted = useCallback(
    (stepKey: string) => {
      return progress?.completed_steps?.includes(stepKey) || false;
    },
    [progress]
  );

  const getCurrentStepInfo = useCallback(() => {
    if (!progress?.current_step) return null;
    return steps.find(s => s.step_key === progress.current_step) || null;
  }, [progress, steps]);

  return {
    progress,
    steps,
    loading,
    showOnboarding,
    setShowOnboarding,
    completeStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    getStepProgress,
    isStepCompleted,
    getCurrentStepInfo,
    refresh: fetchOnboardingData,
  };
}
