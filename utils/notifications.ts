import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  type?: 'price_alert' | 'trade_execution' | 'news' | 'insight' | 'system' | 'trades' | 'alerts' | 'account';
  data?: Record<string, any>;
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export async function saveExpoPushToken(userId: string, token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) throw error;

    console.log('Push token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving push token:', error);
    return false;
  }
}

export async function notifyUser(
  userId: string,
  notification: NotificationData
): Promise<boolean> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('expo_push_token, notifications_enabled')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile?.notifications_enabled) {
      console.log('Notifications disabled for user');
      return false;
    }

    const notificationRecord = {
      user_id: userId,
      title: notification.title,
      body: notification.body,
      type: notification.type || 'system',
      is_read: false,
      data: notification.data || {},
    };

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationRecord);

    if (insertError) throw insertError;

    if (profile.expo_push_token && Platform.OS !== 'web') {
      await sendPushNotification(profile.expo_push_token, notification);
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

async function sendPushNotification(
  expoPushToken: string,
  notification: NotificationData
): Promise<void> {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    categoryIdentifier: notification.type,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log('Push notification sent:', data);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

export async function scheduleLocalNotification(
  notification: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    console.error('Error canceling notification:', error);
    return false;
  }
}

export async function cancelAllNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Error canceling all notifications:', error);
    return false;
  }
}

export function useNotificationObserver(
  callback: (notification: Notifications.Notification) => void
) {
  if (Platform.OS === 'web') {
    return;
  }

  Notifications.addNotificationReceivedListener(callback);
}

export function useNotificationResponseObserver(
  callback: (response: Notifications.NotificationResponse) => void
) {
  if (Platform.OS === 'web') {
    return;
  }

  Notifications.addNotificationResponseReceivedListener(callback);
}
