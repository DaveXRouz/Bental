import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

interface LoginHistoryEntry {
  id: string;
  ip_address: string | null;
  location: string | null;
  device_type: string | null;
  browser: string | null;
  success: boolean;
  created_at: string;
}

export function useLoginHistory(limit: number = 10) {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setHistory(data || []);
    } catch (error) {
      console.error('Error loading login history:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordLogin = async (success: boolean = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceType = Platform.OS === 'web'
        ? 'Web'
        : Platform.OS === 'ios'
        ? 'iOS'
        : 'Android';

      const browser = Platform.OS === 'web'
        ? navigator.userAgent.includes('Chrome')
          ? 'Chrome'
          : navigator.userAgent.includes('Safari')
          ? 'Safari'
          : navigator.userAgent.includes('Firefox')
          ? 'Firefox'
          : 'Unknown'
        : 'Mobile App';

      await supabase.from('login_history').insert({
        user_id: user.id,
        ip_address: null, // Would be filled by backend
        location: null, // Would be filled by IP geolocation service
        device_type: deviceType,
        browser: browser,
        success: success,
      });

      // Reload history after recording
      await loadHistory();
    } catch (error) {
      console.error('Error recording login:', error);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getLocationDisplay = (entry: LoginHistoryEntry): string => {
    if (entry.location) return entry.location;
    if (entry.ip_address) return entry.ip_address;
    return 'Unknown location';
  };

  const getDeviceDisplay = (entry: LoginHistoryEntry): string => {
    const parts = [];
    if (entry.device_type) parts.push(entry.device_type);
    if (entry.browser) parts.push(entry.browser);
    return parts.join(' • ') || 'Unknown device';
  };

  return {
    history,
    loading,
    loadHistory,
    recordLogin,
    formatRelativeTime,
    getLocationDisplay,
    getDeviceDisplay,
  };
}
