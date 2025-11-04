import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Session {
  id: string;
  device_name: string;
  device_id: string;
  trusted: boolean;
  ip_address: string | null;
  last_active: string;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export function useSessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDeviceId, setCurrentDeviceId] = useState<string>('');

  useEffect(() => {
    initializeDeviceId();
    loadSessions();
  }, []);

  const initializeDeviceId = async () => {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');

      if (!deviceId) {
        // Generate unique device ID
        deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }

      setCurrentDeviceId(deviceId);
    } catch (error) {
      console.error('Error initializing device ID:', error);
    }
  };

  const getDeviceName = (): string => {
    if (Platform.OS === 'web') {
      return 'Web Browser';
    }

    const brand = Device.brand || '';
    const modelName = Device.modelName || '';

    if (brand && modelName) {
      return `${brand} ${modelName}`;
    }

    return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
  };

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_active', { ascending: false });

      if (error) throw error;

      // Mark current device
      const sessionsWithCurrent = (data || []).map(session => ({
        ...session,
        is_current: session.device_id === currentDeviceId,
      }));

      setSessions(sessionsWithCurrent);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (trusted: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const deviceName = getDeviceName();

      const { error } = await supabase
        .from('user_sessions')
        .upsert({
          user_id: user.id,
          device_name: deviceName,
          device_id: currentDeviceId,
          trusted,
          ip_address: null, // Would be filled by backend
          last_active: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        }, {
          onConflict: 'user_id,device_id'
        });

      if (error) throw error;

      await loadSessions();
      return { success: true };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, error: 'Failed to create session' };
    }
  };

  const updateSessionActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('device_id', currentDeviceId);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const trustDevice = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ trusted: true })
        .eq('id', sessionId);

      if (error) throw error;

      await loadSessions();
      return { success: true };
    } catch (error) {
      console.error('Error trusting device:', error);
      return { success: false, error: 'Failed to trust device' };
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      await loadSessions();
      return { success: true };
    } catch (error) {
      console.error('Error revoking session:', error);
      return { success: false, error: 'Failed to revoke session' };
    }
  };

  const revokeAllOtherSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user.id)
        .neq('device_id', currentDeviceId);

      if (error) throw error;

      await loadSessions();
      return { success: true };
    } catch (error) {
      console.error('Error revoking sessions:', error);
      return { success: false, error: 'Failed to revoke sessions' };
    }
  };

  return {
    sessions,
    loading,
    currentDeviceId,
    loadSessions,
    createSession,
    updateSessionActivity,
    trustDevice,
    revokeSession,
    revokeAllOtherSessions,
  };
}
