import { useEffect, useState, useCallback } from 'react';
import {
  realtimeManager,
  type ConnectionStatus,
  type SubscriptionOptions,
} from '@/services/realtime/connection-manager';

export interface UseEnhancedRealtimeOptions {
  channelName: string;
  enabled?: boolean;
  onConnectionChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
}

export interface EnhancedRealtimeReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  error: Error | null;
  subscribe: (options: Omit<SubscriptionOptions, 'onData'> & { onData: (payload: any) => void }) => () => void;
  reconnect: () => void;
  disconnect: () => void;
  getActiveSubscriptions: () => number;
}

/**
 * Enhanced real-time hook with auto-reconnect and connection management
 */
export function useEnhancedRealtime(
  options: UseEnhancedRealtimeOptions
): EnhancedRealtimeReturn {
  const {
    channelName,
    enabled = true,
    onConnectionChange,
    onError,
    autoReconnect = true,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeManager.getStatus()
  );
  const [error, setError] = useState<Error | null>(null);
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);

  // Monitor connection status
  useEffect(() => {
    if (!enabled) return;

    const statusListener = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      onConnectionChange?.(status);
    };

    const errorListener = (err: Error) => {
      setError(err);
      onError?.(err);
    };

    // Update with current status
    setConnectionStatus(realtimeManager.getStatus());
    setError(realtimeManager.getLastError());

    // Note: In production, you'd want to add proper event listeners
    // For now, we'll poll status periodically
    const statusInterval = setInterval(() => {
      const currentStatus = realtimeManager.getStatus();
      if (currentStatus !== connectionStatus) {
        statusListener(currentStatus);
      }

      const currentError = realtimeManager.getLastError();
      if (currentError !== error) {
        errorListener(currentError);
      }
    }, 1000);

    return () => {
      clearInterval(statusInterval);
    };
  }, [enabled, channelName, onConnectionChange, onError, connectionStatus, error]);

  /**
   * Subscribe to real-time updates
   */
  const subscribe = useCallback(
    (subscribeOptions: Omit<SubscriptionOptions, 'onData'> & { onData: (payload: any) => void }) => {
      if (!enabled) {
        return () => {};
      }

      const unsubscribe = realtimeManager.subscribe(channelName, {
        ...subscribeOptions,
        onData: subscribeOptions.onData,
      });

      setUnsubscribers(prev => [...prev, unsubscribe]);

      return unsubscribe;
    },
    [enabled, channelName]
  );

  /**
   * Manually trigger reconnection
   */
  const reconnect = useCallback(() => {
    if (!enabled) return;

    realtimeManager.resetReconnectAttempts(channelName);
    realtimeManager.reconnectAll();
  }, [enabled, channelName]);

  /**
   * Disconnect from channel
   */
  const disconnect = useCallback(() => {
    unsubscribers.forEach(unsub => unsub());
    setUnsubscribers([]);
    realtimeManager.disconnect(channelName);
  }, [channelName, unsubscribers]);

  /**
   * Get active subscription count
   */
  const getActiveSubscriptions = useCallback(() => {
    return realtimeManager.getSubscriptionCount(channelName);
  }, [channelName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!enabled) return;
      disconnect();
    };
  }, [enabled, disconnect]);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    error,
    subscribe,
    reconnect,
    disconnect,
    getActiveSubscriptions,
  };
}

/**
 * Specialized hook for admin real-time updates
 */
export function useEnhancedAdminRealtime(enabled: boolean = true) {
  const {
    isConnected,
    connectionStatus,
    error,
    subscribe,
    reconnect,
    disconnect,
  } = useEnhancedRealtime({
    channelName: 'admin-updates',
    enabled,
    autoReconnect: true,
  });

  const subscribeToDeposits = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'cash_courier_deposits',
        event: '*',
        onData,
      });
    },
    [subscribe]
  );

  const subscribeToWithdrawals = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'withdrawals',
        event: '*',
        onData,
      });
    },
    [subscribe]
  );

  const subscribeToUsers = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'profiles',
        event: 'UPDATE',
        onData,
      });
    },
    [subscribe]
  );

  const subscribeToKYC = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'kyc_documents',
        event: '*',
        onData,
      });
    },
    [subscribe]
  );

  const subscribeToBots = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'bots',
        event: '*',
        onData,
      });
    },
    [subscribe]
  );

  const subscribeToNotifications = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'notifications',
        event: 'INSERT',
        onData,
      });
    },
    [subscribe]
  );

  return {
    isConnected,
    connectionStatus,
    error,
    reconnect,
    disconnect,
    subscribeToDeposits,
    subscribeToWithdrawals,
    subscribeToUsers,
    subscribeToKYC,
    subscribeToBots,
    subscribeToNotifications,
  };
}

/**
 * Specialized hook for CRM real-time updates
 */
export function useEnhancedCRMRealtime(enabled: boolean = true) {
  const {
    isConnected,
    connectionStatus,
    error,
    subscribe,
    reconnect,
    disconnect,
  } = useEnhancedRealtime({
    channelName: 'crm-updates',
    enabled,
    autoReconnect: true,
  });

  const subscribeToLeads = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'leads',
        event: '*',
        onData,
      });
    },
    [subscribe]
  );

  const subscribeToActivities = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'user_activities',
        event: 'INSERT',
        onData,
      });
    },
    [subscribe]
  );

  const subscribeToAlerts = useCallback(
    (onData: (payload: any) => void) => {
      return subscribe({
        table: 'triggered_alerts',
        event: 'INSERT',
        filter: 'status=eq.pending',
        onData,
      });
    },
    [subscribe]
  );

  return {
    isConnected,
    connectionStatus,
    error,
    reconnect,
    disconnect,
    subscribeToLeads,
    subscribeToActivities,
    subscribeToAlerts,
  };
}

/**
 * Hook for monitoring connection health across all channels
 */
export function useRealtimeHealth() {
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const [overallStatus, setOverallStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveChannels(realtimeManager.getActiveChannels());
      setOverallStatus(realtimeManager.getStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const reconnectAll = useCallback(() => {
    realtimeManager.reconnectAll();
  }, []);

  const disconnectAll = useCallback(() => {
    realtimeManager.disconnectAll();
  }, []);

  return {
    activeChannels,
    channelCount: activeChannels.length,
    overallStatus,
    isHealthy: overallStatus === 'connected',
    reconnectAll,
    disconnectAll,
  };
}
