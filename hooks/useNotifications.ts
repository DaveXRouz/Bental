import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  type: 'price_alert' | 'trade_execution' | 'news' | 'insight' | 'system' | 'trades' | 'alerts' | 'account';
  title: string;
  body: string;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
      setError(null);
    } catch (err: any) {
      console.error('[useNotifications] Error fetching notifications:', err);

      // Provide detailed error messages based on error type
      let errorMessage = 'Failed to load notifications';

      if (err?.message) {
        errorMessage = err.message;
      }

      // Check for specific Supabase errors
      if (err?.code === 'PGRST116') {
        errorMessage = 'Unable to access notifications. Please try again.';
      } else if (err?.code === '42501') {
        errorMessage = 'Permission denied. Please contact support.';
      } else if (err?.message?.includes('JWT')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
        errorMessage = 'Network error. Check your connection and try again.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[useNotifications] Error marking as read:', err);
      throw err;
    }
  }, [userId]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[useNotifications] Error marking all as read:', err);
      throw err;
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    if (!userId) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      console.error('[useNotifications] Error deleting notification:', err);
      throw err;
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
  };
}
