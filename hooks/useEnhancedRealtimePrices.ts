/**
 * Enhanced Realtime Prices Hook
 *
 * React hook for real-time price updates with:
 * - Automatic WebSocket connection management
 * - Symbol subscription/unsubscription
 * - Connection status monitoring
 * - Price data caching
 * - Automatic cleanup on unmount
 *
 * @example
 * ```typescript
 * const { prices, subscribe, unsubscribe, status, isConnected } = useEnhancedRealtimePrices();
 *
 * useEffect(() => {
 *   subscribe(['AAPL', 'GOOGL', 'MSFT']);
 *   return () => unsubscribe(['AAPL', 'GOOGL', 'MSFT']);
 * }, []);
 *
 * const applePrice = prices['AAPL'];
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { EnhancedWebSocket, PriceUpdate, WebSocketStatus } from '@/services/realtime/enhanced-websocket';

interface PriceData extends PriceUpdate {
  lastUpdate: Date;
}

interface UseEnhancedRealtimePricesReturn {
  prices: Record<string, PriceData>;
  subscribe: (symbols: string | string[]) => void;
  unsubscribe: (symbols: string | string[]) => void;
  status: WebSocketStatus;
  isConnected: boolean;
  reconnectAttempts: number;
}

// Singleton WebSocket instance to share across components
let wsInstance: EnhancedWebSocket | null = null;
let wsListenerCount = 0;

const getWebSocketInstance = (): EnhancedWebSocket => {
  if (!wsInstance) {
    // TODO: Replace with your actual WebSocket URL
    const wsUrl = __DEV__
      ? 'ws://localhost:3000/ws'
      : `wss://${process.env.EXPO_PUBLIC_WS_URL || 'api.example.com'}/ws`;

    wsInstance = new EnhancedWebSocket({
      url: wsUrl,
      reconnect: true,
      reconnectInterval: 1000,
      reconnectDecay: 1.5,
      maxReconnectInterval: 30000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageQueueSize: 100,
    });

    // Auto-connect on first instance creation
    wsInstance.connect();
  }

  return wsInstance;
};

/**
 * Enhanced Realtime Prices Hook
 *
 * Provides real-time price updates for subscribed symbols with automatic
 * connection management and data caching.
 */
export function useEnhancedRealtimePrices(): UseEnhancedRealtimePricesReturn {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsRef = useRef<EnhancedWebSocket | null>(null);
  const subscribedSymbols = useRef<Set<string>>(new Set());

  // Initialize WebSocket connection
  useEffect(() => {
    wsRef.current = getWebSocketInstance();
    wsListenerCount++;

    // Set initial status
    setStatus(wsRef.current.getStatus());

    // Status listener
    const handleStatus = (newStatus: WebSocketStatus) => {
      setStatus(newStatus);
    };

    // Price update listener
    const handlePriceUpdate = (update: PriceUpdate) => {
      setPrices((prev) => ({
        ...prev,
        [update.symbol]: {
          ...update,
          lastUpdate: new Date(update.timestamp),
        },
      }));
    };

    // Reconnect attempt tracking
    const handleReconnecting = () => {
      setReconnectAttempts((prev) => prev + 1);
    };

    const handleConnected = () => {
      setReconnectAttempts(0);
    };

    // Attach listeners
    wsRef.current.on('status', handleStatus);
    wsRef.current.on('price_update', handlePriceUpdate);
    wsRef.current.on('disconnected', handleReconnecting);
    wsRef.current.on('connected', handleConnected);

    // Cleanup on unmount
    return () => {
      if (!wsRef.current) return;

      wsRef.current.off('status', handleStatus);
      wsRef.current.off('price_update', handlePriceUpdate);
      wsRef.current.off('disconnected', handleReconnecting);
      wsRef.current.off('connected', handleConnected);

      // Unsubscribe from all symbols
      if (subscribedSymbols.current.size > 0) {
        wsRef.current.unsubscribe(Array.from(subscribedSymbols.current));
        subscribedSymbols.current.clear();
      }

      wsListenerCount--;

      // Disconnect WebSocket only when no more listeners
      if (wsListenerCount === 0 && wsInstance) {
        wsInstance.disconnect();
        wsInstance = null;
      }
    };
  }, []);

  /**
   * Subscribe to symbol price updates
   */
  const subscribe = useCallback((symbols: string | string[]) => {
    if (!wsRef.current) return;

    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];

    symbolArray.forEach((symbol) => {
      subscribedSymbols.current.add(symbol);
    });

    wsRef.current.subscribe(symbolArray);
  }, []);

  /**
   * Unsubscribe from symbol price updates
   */
  const unsubscribe = useCallback((symbols: string | string[]) => {
    if (!wsRef.current) return;

    const symbolArray = Array.isArray(symbols) ? symbols : [symbols];

    symbolArray.forEach((symbol) => {
      subscribedSymbols.current.delete(symbol);
    });

    wsRef.current.unsubscribe(symbolArray);
  }, []);

  const isConnected = status === 'connected';

  return {
    prices,
    subscribe,
    unsubscribe,
    status,
    isConnected,
    reconnectAttempts,
  };
}

/**
 * Hook for subscribing to a specific symbol
 *
 * @example
 * ```typescript
 * const priceData = useSymbolPrice('AAPL');
 * ```
 */
export function useSymbolPrice(symbol: string): PriceData | null {
  const { prices, subscribe, unsubscribe } = useEnhancedRealtimePrices();

  useEffect(() => {
    if (symbol) {
      subscribe(symbol);
      return () => unsubscribe(symbol);
    }
  }, [symbol, subscribe, unsubscribe]);

  return prices[symbol] || null;
}

/**
 * Hook for subscribing to multiple symbols
 *
 * @example
 * ```typescript
 * const prices = useMultipleSymbolPrices(['AAPL', 'GOOGL', 'MSFT']);
 * ```
 */
export function useMultipleSymbolPrices(symbols: string[]): Record<string, PriceData> {
  const { prices, subscribe, unsubscribe } = useEnhancedRealtimePrices();

  useEffect(() => {
    if (symbols.length > 0) {
      subscribe(symbols);
      return () => unsubscribe(symbols);
    }
  }, [symbols.join(','), subscribe, unsubscribe]);

  // Filter prices to only return subscribed symbols
  return symbols.reduce((acc, symbol) => {
    if (prices[symbol]) {
      acc[symbol] = prices[symbol];
    }
    return acc;
  }, {} as Record<string, PriceData>);
}
