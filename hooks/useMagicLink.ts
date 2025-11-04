import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useMagicLink() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sendMagicLink = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setEmailSent(false);

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Send magic link using Supabase Auth
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Magic link error:', error);

        if (error.message.includes('rate')) {
          return { success: false, error: 'Too many requests. Please try again later.' };
        }

        return { success: false, error: 'Failed to send magic link. Please try again.' };
      }

      setEmailSent(true);
      return { success: true };
    } catch (error) {
      console.error('Magic link error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        console.error('OTP verification error:', error);
        return { success: false, error: 'Invalid or expired code' };
      }

      if (data?.user) {
        return { success: true };
      }

      return { success: false, error: 'Verification failed' };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const resetState = () => {
    setEmailSent(false);
    setLoading(false);
  };

  return {
    loading,
    emailSent,
    sendMagicLink,
    verifyOtp,
    resetState,
  };
}
