import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface MFASettings {
  id: string;
  enabled: boolean;
  method: 'totp' | 'sms';
  phone_number?: string;
  verified_at?: string;
}

export function useMFA() {
  const [mfaSettings, setMFASettings] = useState<MFASettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMFASettings();
  }, []);

  const loadMFASettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('mfa_secrets')
        .select('id, enabled, method, phone_number, verified_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading MFA settings:', error);
        return;
      }

      setMFASettings(data);
    } catch (error) {
      console.error('Error in loadMFASettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableMFA = async (method: 'totp' | 'sms', phoneNumber?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate TOTP secret (in production, use proper crypto library)
      const secret = generateSecret();

      const { data, error } = await supabase
        .from('mfa_secrets')
        .upsert({
          user_id: user.id,
          secret,
          method,
          phone_number: phoneNumber,
          enabled: true,
          verified_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      setMFASettings(data);
      return { success: true, secret };
    } catch (error) {
      console.error('Error enabling MFA:', error);
      return { success: false, error: 'Failed to enable MFA' };
    }
  };

  const disableMFA = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('mfa_secrets')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMFASettings(null);
      return { success: true };
    } catch (error) {
      console.error('Error disabling MFA:', error);
      return { success: false, error: 'Failed to disable MFA' };
    }
  };

  const verifyMFACode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    // In production, verify against TOTP algorithm or SMS service
    // This is a simplified version
    if (code.length !== 6) {
      return { success: false, error: 'Code must be 6 digits' };
    }

    // Simulate verification
    const isValid = /^\d{6}$/.test(code);

    if (isValid) {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid code' };
    }
  };

  const generateBackupCodes = async (): Promise<string[]> => {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return codes;

      await supabase
        .from('mfa_secrets')
        .update({ backup_codes: codes })
        .eq('user_id', user.id);

      return codes;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      return codes;
    }
  };

  return {
    mfaSettings,
    loading,
    enableMFA,
    disableMFA,
    verifyMFACode,
    generateBackupCodes,
    reload: loadMFASettings,
  };
}

// Helper function to generate TOTP secret
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)];
  }
  return secret;
}
