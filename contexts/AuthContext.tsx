import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { setUser as setSentryUser, clearUser as clearSentryUser } from '@/utils/sentry';
import { clearConsole } from '@/utils/console-manager';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string, loginMode?: 'email' | 'passport') => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mark AuthProvider as ready
    if (typeof window !== 'undefined') {
      window.__AUTH_PROVIDER_READY__ = true;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setSentryUser({
          id: session.user.id,
          email: session.user.email,
        });
      }

      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setSentryUser({
            id: session.user.id,
            email: session.user.email,
          });
        } else {
          clearSentryUser();
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (identifier: string, password: string, loginMode: 'email' | 'passport' = 'email') => {
    clearConsole();
    try {
      let emailToUse = identifier;

      if (loginMode === 'passport') {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('trading_passport_number', identifier.toUpperCase())
          .maybeSingle();

        if (profileError || !profile) {
          await supabase.rpc('record_login_attempt', {
            p_email: identifier,
            p_success: false,
            p_failure_reason: 'Invalid trading passport',
          });
          return { error: { message: 'Invalid trading passport number' } };
        }
        emailToUse = profile.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      await supabase.rpc('record_login_attempt', {
        p_email: emailToUse,
        p_success: !error,
        p_failure_reason: error?.message,
      });

      if (!error && data.user) {
        await supabase.rpc('record_login_history', {
          p_user_id: data.user.id,
          p_device_type: Platform.OS,
        });
      }

      return { error };
    } catch (err: any) {
      return { error: { message: err.message || 'Login failed' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    clearConsole();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return { error: authError };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
      });

    if (profileError) {
      return { error: profileError };
    }

    // No automatic account creation - users must create accounts manually
    // All accounts start with $0.00 balance
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: Platform.OS === 'web'
          ? `${window.location.origin}/(tabs)`
          : undefined,
      },
    });
    return { error };
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: Platform.OS === 'web'
          ? `${window.location.origin}/(tabs)`
          : undefined,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearSentryUser();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      if (!user?.email) {
        return { success: false, error: 'No authenticated user found' };
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      await supabase
        .from('profiles')
        .update({ password_changed_at: new Date().toISOString() })
        .eq('id', user.id);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to change password' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: Platform.OS === 'web'
          ? `${window.location.origin}/(auth)/reset-password`
          : 'myapp://reset-password',
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to send reset email' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (user?.id) {
        await supabase
          .from('profiles')
          .update({
            password_changed_at: new Date().toISOString(),
            using_default_password: false
          })
          .eq('id', user.id);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to update password' };
    }
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    changePassword,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During app initialization, return a temporary loading state
    // instead of throwing an error immediately
    if (typeof window !== 'undefined' && !window.__AUTH_PROVIDER_READY__) {
      return {
        session: null,
        user: null,
        loading: true,
        signIn: async () => ({ error: null }),
        signUp: async () => ({ error: null }),
        signInWithGoogle: async () => ({ error: null }),
        signInWithApple: async () => ({ error: null }),
        signOut: async () => {},
        changePassword: async () => ({ success: false }),
        resetPassword: async () => ({ success: false }),
        updatePassword: async () => ({ success: false }),
      } as AuthContextType;
    }

    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider> in app/_layout.tsx. ' +
      'If you are seeing this error during app initialization, ensure providers are mounted before routes are evaluated.'
    );
  }
  return context;
}

// Mark AuthProvider as ready
declare global {
  interface Window {
    __AUTH_PROVIDER_READY__?: boolean;
  }
}
