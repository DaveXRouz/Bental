/**
 * Enhanced WebSocket Manager
 *
 * Production-ready WebSocket implementation with:
 * - Automatic reconnection with exponential backoff
 * - Connection health monitoring with heartbeat
 * - Message queuing for offline resilience
 * - Subscription management with deduplication
 * - Event-based architecture for clean integration
 * - Safe JSON message parsing with validation
 */

import { EventEmitter } from 'events';
import { safeWebSocketJson } from '@/utils/safe-json-parser';

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectDecay?: number;
  maxReconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: number;
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

export class EnhancedWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  private messageQueue: any[] = [];
  private subscriptions: Set<string> = new Set();
  private status: WebSocketStatus = 'disconnected';
  private intentionallyClosed = false;

  constructor(config: WebSocketConfig) {
    super();

    this.config = {
      url: config.url,
      protocols: config.protocols,
      reconnect: config.reconnect !== false,
      reconnectInterval: config.reconnectInterval || 1000,
      reconnectDecay: config.reconnectDecay || 1.5,
      maxReconnectInterval: config.maxReconnectInterval || 30000,
      maxReconnectAttempts: config.maxReconnectAttempts || Infinity,
      heartbeatInterval: config.heartbeatInterval || 30000,
      messageQueueSize: config.messageQueueSize || 100,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.warn('[WebSocket] Already connected or connecting');
      return;
    }

    this.intentionallyClosed = false;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.intentionallyClosed = true;
    this.clearTimers();
    this.subscriptions.clear();
    this.messageQueue = [];

    if (this.ws) {
      this.setStatus('disconnecting');
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setStatus('disconnected');
  }

  /**
   * Send message to server
   */
  send(data: any): void {
    if (!this.isConnected()) {
      console.warn('[WebSocket] Not connected, queueing message');
      this.queueMessage(data);
      return;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws!.send(message);
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      this.queueMessage(data);
    }
  }

  /**
   * Subscribe to symbol price updates
   */
  subscribe(symbols: string | string[]): void {
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];

    symbolArray.forEach(symbol => {
      if (!this.subscriptions.has(symbol)) {
        this.subscriptions.add(symbol);

        if (this.isConnected()) {
          this.send({
            type: 'subscribe',
            symbol,
          });
        }
      }
    });
  }

  /**
   * Unsubscribe from symbol price updates
   */
  unsubscribe(symbols: string | string[]): void {
    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];

    symbolArray.forEach(symbol => {
      if (this.subscriptions.has(symbol)) {
        this.subscriptions.delete(symbol);

        if (this.isConnected()) {
          this.send({
            type: 'unsubscribe',
            symbol,
          });
        }
      }
    });
  }

  /**
   * Get current connection status
   */
  getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get subscribed symbols
   */
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  /**
   * Handle connection open
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.setStatus('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.resubscribe();
    this.flushMessageQueue();
    this.emit('connected');
  }

  /**
   * Handle connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Disconnected:', event.code, event.reason);
    this.setStatus('disconnected');
    this.stopHeartbeat();
    this.emit('disconnected', event);

    if (!this.intentionallyClosed && this.config.reconnect) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection error
   */
  private handleError(error: Event): void {
    console.error('[WebSocket] Error:', error);
    this.setStatus('error');
    this.emit('error', error);
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // Safely parse WebSocket message
      const data = safeWebSocketJson(event.data, {
        errorContext: 'WebSocket message',
        logOnError: true,
        allowEmpty: false,
      });

      // Update last heartbeat time
      this.lastHeartbeat = Date.now();

      // Handle different message types
      switch (data.type) {
        case 'price_update':
          this.handlePriceUpdate(data);
          break;
        case 'heartbeat':
        case 'pong':
          // Heartbeat acknowledged
          break;
        case 'subscribed':
          this.emit('subscribed', data.symbol);
          break;
        case 'unsubscribed':
          this.emit('unsubscribed', data.symbol);
          break;
        case 'error':
          console.error('[WebSocket] Server error:', data.message);
          this.emit('server_error', data);
          break;
        default:
          this.emit('message', data);
      }
    } catch (error: any) {
      console.error('[WebSocket] Message parse error:', {
        error: error.message,
        type: error.type,
        data: typeof event.data === 'string' ? event.data.substring(0, 200) : 'Binary data',
      });
      this.emit('parse_error', error);
    }
  }

  /**
   * Handle price update message
   */
  private handlePriceUpdate(data: any): void {
    const update: PriceUpdate = {
      symbol: data.symbol,
      price: data.price,
      change: data.change || 0,
      changePercent: data.changePercent || 0,
      volume: data.volume,
      timestamp: data.timestamp || Date.now(),
    };

    this.emit('price_update', update);
    this.emit(`price_update:${update.symbol}`, update);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      this.emit('max_reconnect_attempts');
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(this.config.reconnectDecay, this.reconnectAttempts),
      this.config.maxReconnectInterval
    );

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.lastHeartbeat = Date.now();

    this.heartbeatTimer = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat;

      if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
        console.warn('[WebSocket] Heartbeat timeout, reconnecting');
        this.disconnect();
        this.connect();
      } else {
        // Send ping
        this.send({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(data: any): void {
    if (this.messageQueue.length >= this.config.messageQueueSize) {
      this.messageQueue.shift(); // Remove oldest message
    }
    this.messageQueue.push(data);
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Resubscribe to all symbols after reconnection
   */
  private resubscribe(): void {
    if (this.subscriptions.size > 0) {
      this.send({
        type: 'subscribe',
        symbols: Array.from(this.subscriptions),
      });
    }
  }

  /**
   * Set connection status
   */
  private setStatus(status: WebSocketStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emit('status', status);
    }
  }
}
