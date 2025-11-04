import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '@/lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationToken {
  token: string;
  platform: string;
  deviceInfo: {
    isDevice: boolean;
    brand?: string;
    modelName?: string;
    osName?: string;
    osVersion?: string;
  };
}

/**
 * Request push notification permissions
 */
export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting push permissions:', error);
    return false;
  }
}

/**
 * Register device for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if device supports push
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const hasPermission = await requestPushPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
    });

    const token = tokenData.data;

    // Save token to database
    await savePushToken(token);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to database
 */
export async function savePushToken(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const deviceInfo = {
      isDevice: Device.isDevice,
      brand: Device.brand,
      modelName: Device.modelName,
      osName: Device.osName,
      osVersion: Device.osVersion,
    };

    const { error } = await supabase
      .from('push_notification_tokens')
      .upsert([
        {
          user_id: user.id,
          token,
          platform: Platform.OS,
          device_info: deviceInfo,
          active: true,
        },
      ], {
        onConflict: 'user_id,token',
      });

    if (error) {
      console.error('Error saving push token:', error);
    }
  } catch (error) {
    console.error('Error in savePushToken:', error);
  }
}

/**
 * Unregister device from push notifications
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('push_notification_tokens')
      .update({ active: false })
      .eq('user_id', user.id);
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
  }
}

/**
 * Send local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  seconds: number = 0
): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: seconds > 0 ? { seconds } : null,
    });

    return identifier;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
}

/**
 * Cancel scheduled notification
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<string> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error getting notification permission status:', error);
    return 'undetermined';
  }
}

/**
 * Listen for notification responses (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Listen for incoming notifications (when notification is received)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Hook for using push notifications in components
 */
export function usePushNotifications() {
  const [token, setToken] = React.useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = React.useState<string>('undetermined');

  React.useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then(setToken);

    // Get permission status
    getNotificationPermissionStatus().then(setPermissionStatus);

    // Listen for incoming notifications
    const notificationListener = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for notification responses
    const responseListener = addNotificationResponseListener((response) => {
      console.log('Notification response:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return {
    token,
    permissionStatus,
    requestPermission: requestPushPermissions,
    scheduleNotification: scheduleLocalNotification,
    cancelNotification,
    cancelAllNotifications,
  };
}

// Polyfill React for standalone usage
const React = require('react');
