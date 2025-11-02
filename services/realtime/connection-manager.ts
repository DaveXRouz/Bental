import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export interface ConnectionConfig {
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
}

export interface SubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  filter?: string;
  onData: (payload: any) => void;
}

const DEFAULT_CONFIG: Required<ConnectionConfig> = {
  maxReconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  onStatusChange: () => {},
  onError: () => {},
  onReconnect: () => {},
};

export class RealtimeConnectionManager {
  private config: Required<ConnectionConfig>;
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, SubscriptionOptions[]> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private status: ConnectionStatus = 'disconnected';
  private lastError: Error | null = null;

  constructor(config: ConnectionConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create or get a channel with auto-reconnect capabilities
   */
  public getChannel(channelName: string): RealtimeChannel {
    let channel = this.channels.get(channelName);

    if (!channel) {
      channel = this.createChannel(channelName);
      this.channels.set(channelName, channel);
    }

    return channel;
  }

  /**
   * Subscribe to database changes with auto-reconnect
   */
  public subscribe(channelName: string, options: SubscriptionOptions): () => void {
    const channel = this.getChannel(channelName);

    // Store subscription for reconnection
    const channelSubs = this.subscriptions.get(channelName) || [];
    channelSubs.push(options);
    this.subscriptions.set(channelName, channelSubs);

    // Setup postgres changes listener
    channel.on(
      'postgres_changes',
      {
        event: options.event || '*',
        schema: options.schema || 'public',
        table: options.table,
        filter: options.filter,
      },
      (payload) => {
        try {
          options.onData(payload);
        } catch (error) {
          console.error('Error in subscription callback:', error);
          this.handleError(new Error(`Callback error: ${error}`));
        }
      }
    );

    // Subscribe if not already
    if (this.status === 'disconnected' || !this.channels.get(channelName)) {
      this.connectChannel(channelName);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channelName, options);
    };
  }

  /**
   * Unsubscribe from specific subscription
   */
  private unsubscribe(channelName: string, options: SubscriptionOptions): void {
    const channelSubs = this.subscriptions.get(channelName) || [];
    const filtered = channelSubs.filter(sub => sub !== options);

    if (filtered.length === 0) {
      this.disconnect(channelName);
      this.subscriptions.delete(channelName);
    } else {
      this.subscriptions.set(channelName, filtered);
    }
  }

  /**
   * Create a new channel
   */
  private createChannel(channelName: string): RealtimeChannel {
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: '' },
      },
    });

    return channel;
  }

  /**
   * Connect channel with status monitoring
   */
  private connectChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    this.setStatus('connecting');

    channel.subscribe((status, error) => {
      console.log(`Channel ${channelName} status:`, status);

      if (status === 'SUBSCRIBED') {
        this.setStatus('connected');
        this.reconnectAttempts.set(channelName, 0);
        this.clearReconnectTimer(channelName);
        this.startHeartbeat(channelName);
      } else if (status === 'CHANNEL_ERROR') {
        this.handleChannelError(channelName, error);
      } else if (status === 'TIMED_OUT') {
        this.handleTimeout(channelName);
      } else if (status === 'CLOSED') {
        this.handleDisconnect(channelName);
      }
    });
  }

  /**
   * Handle channel error and attempt reconnection
   */
  private handleChannelError(channelName: string, error?: Error): void {
    console.error(`Channel ${channelName} error:`, error);

    this.setStatus('error');
    this.lastError = error || new Error('Channel error');
    this.config.onError(this.lastError);

    this.attemptReconnect(channelName);
  }

  /**
   * Handle connection timeout
   */
  private handleTimeout(channelName: string): void {
    console.warn(`Channel ${channelName} timed out`);
    this.attemptReconnect(channelName);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(channelName: string): void {
    console.warn(`Channel ${channelName} disconnected`);
    this.stopHeartbeat(channelName);
    this.attemptReconnect(channelName);
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(channelName: string): void {
    const attempts = this.reconnectAttempts.get(channelName) || 0;

    if (attempts >= this.config.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for ${channelName}`);
      this.setStatus('error');
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts.set(channelName, attempts + 1);

    // Exponential backoff: 3s, 6s, 12s, 24s, 48s
    const backoffDelay = this.config.reconnectInterval * Math.pow(2, attempts);

    console.log(`Reconnecting ${channelName} in ${backoffDelay}ms (attempt ${attempts + 1}/${this.config.maxReconnectAttempts})`);

    this.config.onReconnect(attempts + 1);

    const timer = setTimeout(() => {
      this.reconnect(channelName);
    }, backoffDelay);

    this.reconnectTimers.set(channelName, timer);
  }

  /**
   * Reconnect channel
   */
  private reconnect(channelName: string): void {
    console.log(`Reconnecting channel: ${channelName}`);

    // Remove old channel
    const oldChannel = this.channels.get(channelName);
    if (oldChannel) {
      oldChannel.unsubscribe();
    }

    // Create new channel
    const newChannel = this.createChannel(channelName);
    this.channels.set(channelName, newChannel);

    // Resubscribe to all subscriptions
    const subs = this.subscriptions.get(channelName) || [];
    subs.forEach(sub => {
      newChannel.on(
        'postgres_changes',
        {
          event: sub.event || '*',
          schema: sub.schema || 'public',
          table: sub.table,
          filter: sub.filter,
        },
        sub.onData
      );
    });

    // Connect
    this.connectChannel(channelName);
  }

  /**
   * Start heartbeat to detect connection issues
   */
  private startHeartbeat(channelName: string): void {
    this.stopHeartbeat(channelName);

    const timer = setInterval(() => {
      this.checkConnection(channelName);
    }, this.config.heartbeatInterval);

    this.heartbeatTimers.set(channelName, timer);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(channelName: string): void {
    const timer = this.heartbeatTimers.get(channelName);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(channelName);
    }
  }

  /**
   * Check connection health
   */
  private checkConnection(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    // Check if channel is still subscribed
    const state = (channel as any).state;
    if (state !== 'joined') {
      console.warn(`Channel ${channelName} health check failed, state: ${state}`);
      this.handleDisconnect(channelName);
    }
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(channelName: string): void {
    const timer = this.reconnectTimers.get(channelName);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(channelName);
    }
  }

  /**
   * Disconnect a specific channel
   */
  public disconnect(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
    }

    this.stopHeartbeat(channelName);
    this.clearReconnectTimer(channelName);
    this.reconnectAttempts.delete(channelName);

    if (this.channels.size === 0) {
      this.setStatus('disconnected');
    }
  }

  /**
   * Disconnect all channels
   */
  public disconnectAll(): void {
    this.channels.forEach((_, channelName) => {
      this.disconnect(channelName);
    });

    this.subscriptions.clear();
    this.setStatus('disconnected');
  }

  /**
   * Manually trigger reconnection for all channels
   */
  public reconnectAll(): void {
    this.channels.forEach((_, channelName) => {
      this.reconnect(channelName);
    });
  }

  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get last error
   */
  public getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Set status and notify listeners
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.config.onStatusChange(status);
    }
  }

  /**
   * Handle error
   */
  private handleError(error: Error): void {
    this.lastError = error;
    this.config.onError(error);
  }

  /**
   * Reset reconnect attempts for a channel
   */
  public resetReconnectAttempts(channelName: string): void {
    this.reconnectAttempts.set(channelName, 0);
  }

  /**
   * Get active channels
   */
  public getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get subscription count for a channel
   */
  public getSubscriptionCount(channelName: string): number {
    return (this.subscriptions.get(channelName) || []).length;
  }
}

// Singleton instance
export const realtimeManager = new RealtimeConnectionManager({
  maxReconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
  onStatusChange: (status) => {
    console.log('Realtime status changed:', status);
  },
  onError: (error) => {
    console.error('Realtime error:', error);
  },
  onReconnect: (attempt) => {
    console.log(`Reconnection attempt: ${attempt}`);
  },
});
