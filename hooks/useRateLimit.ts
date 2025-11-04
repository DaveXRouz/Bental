import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface RateLimitStatus {
  allowed: boolean;
  attempts: number;
  remaining?: number;
  lockout_until?: string;
  retry_after_seconds?: number;
}

export function useRateLimit(email: string | null) {
  const [status, setStatus] = useState<RateLimitStatus>({
    allowed: true,
    attempts: 0,
  });
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (email) {
      checkRateLimit();
    }
  }, [email]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Recheck rate limit when countdown expires
            if (email) checkRateLimit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown, email]);

  const checkRateLimit = async () => {
    if (!email) return;

    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_email: email,
        p_window_minutes: 15,
        p_max_attempts: 5,
      });

      if (error) {
        console.error('Rate limit check error:', error);
        return;
      }

      setStatus(data as RateLimitStatus);

      if (data.retry_after_seconds) {
        setCountdown(data.retry_after_seconds);
      }
    } catch (error) {
      console.error('Error checking rate limit:', error);
    }
  };

  const recordAttempt = async (success: boolean, failureReason?: string) => {
    if (!email) return;

    try {
      await supabase.from('login_attempts').insert({
        email,
        success,
        failure_reason: failureReason,
        ip_address: null, // Would be filled by backend
        user_agent: navigator.userAgent,
      });

      // Recheck rate limit after recording attempt
      await checkRateLimit();
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  };

  const formatCountdown = (): string => {
    if (countdown === 0) return '';

    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return {
    status,
    countdown,
    checkRateLimit,
    recordAttempt,
    formatCountdown,
    isLocked: !status.allowed,
  };
}
