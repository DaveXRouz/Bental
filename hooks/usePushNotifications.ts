import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '@/services/notifications/push-notification-service';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function usePushNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  const registerForNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const token = await pushNotificationService.registerForPushNotifications(user.id);
      setExpoPushToken(token);
      setPermissionGranted(!!token);
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      setPermissionGranted(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      registerForNotifications();
    }

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id, registerForNotifications]);

  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>,
    seconds: number = 1
  ) => {
    await pushNotificationService.scheduleLocalNotification(title, body, data, seconds);
  }, []);

  const sendImmediateNotification = useCallback(async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    await pushNotificationService.sendImmediateNotification(title, body, data);
  }, []);

  const cancelAllNotifications = useCallback(async () => {
    await pushNotificationService.cancelAllNotifications();
  }, []);

  const setBadgeCount = useCallback(async (count: number) => {
    await pushNotificationService.setBadgeCount(count);
  }, []);

  const saveNotification = useCallback(async (
    title: string,
    message: string,
    type: string = 'general',
    metadata?: Record<string, any>
  ) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title,
          message,
          type,
          metadata,
          read: false,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving notification:', error);
    }
  }, [user?.id]);

  return {
    expoPushToken,
    notification,
    permissionGranted,
    loading,
    registerForNotifications,
    scheduleNotification,
    sendImmediateNotification,
    cancelAllNotifications,
    setBadgeCount,
    saveNotification,
  };
}
