/**
 * Centralized Logging Utility
 *
 * Provides environment-aware logging with proper log levels.
 * In production, only errors and warnings are logged.
 * In development, all log levels are active.
 */

import Constants from 'expo-constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  context?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isDemo: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  constructor() {
    const env = Constants.expoConfig?.extra?.EXPO_PUBLIC_ENV || process.env.EXPO_PUBLIC_ENV || 'dev';
    const demoMode = Constants.expoConfig?.extra?.EXPO_PUBLIC_DEMO_MODE || process.env.EXPO_PUBLIC_DEMO_MODE;

    this.isDevelopment = env === 'dev' || env === 'development';
    this.isDemo = demoMode === 'true' || demoMode === true;
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      this.log('debug', message, data, context);
      console.debug(`[DEBUG]${context ? ` [${context}]` : ''} ${message}`, data || '');
    }
  }

  /**
   * Log general information (only in development)
   */
  info(message: string, data?: any, context?: string): void {
    if (this.isDevelopment) {
      this.log('info', message, data, context);
      console.info(`[INFO]${context ? ` [${context}]` : ''} ${message}`, data || '');
    }
  }

  /**
   * Log warnings (always logged)
   */
  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
    console.warn(`[WARN]${context ? ` [${context}]` : ''} ${message}`, data || '');
  }

  /**
   * Log errors (always logged)
   */
  error(message: string, error?: any, context?: string): void {
    this.log('error', message, error, context);
    console.error(`[ERROR]${context ? ` [${context}]` : ''} ${message}`, error || '');

    // In production, you would send this to Sentry or similar
    if (!this.isDevelopment && !this.isDemo) {
      this.sendToMonitoring(message, error, context);
    }
  }

  /**
   * Log API requests (only in development)
   */
  api(method: string, url: string, data?: any): void {
    if (this.isDevelopment) {
      this.debug(`API ${method} ${url}`, data, 'API');
    }
  }

  /**
   * Log database queries (only in development)
   */
  query(query: string, params?: any): void {
    if (this.isDevelopment) {
      this.debug(`DB Query: ${query}`, params, 'Database');
    }
  }

  /**
   * Log navigation events (only in development)
   */
  navigation(screen: string, params?: any): void {
    if (this.isDevelopment) {
      this.info(`Navigation → ${screen}`, params, 'Navigation');
    }
  }

  /**
   * Log user actions for analytics (always logged)
   */
  analytics(event: string, properties?: any): void {
    this.info(`Analytics: ${event}`, properties, 'Analytics');

    // In production, send to PostHog or similar
    if (!this.isDevelopment && !this.isDemo) {
      this.sendToAnalytics(event, properties);
    }
  }

  /**
   * Get recent log history (useful for debugging)
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Internal log storage
   */
  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      context,
    };

    this.logHistory.push(entry);

    // Keep history size manageable
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Send critical errors to monitoring service (Sentry, etc.)
   */
  private sendToMonitoring(message: string, error?: any, context?: string): void {
    // TODO: Implement Sentry or similar
    // This would be implemented when Sentry is configured
    // Example:
    // Sentry.captureException(error, {
    //   tags: { context },
    //   extra: { message },
    // });
  }

  /**
   * Send analytics events to tracking service
   */
  private sendToAnalytics(event: string, properties?: any): void {
    // TODO: Implement PostHog or similar
    // This would be implemented when PostHog is configured
    // Example:
    // posthog.capture(event, properties);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, data?: any, context?: string) => logger.debug(message, data, context),
  info: (message: string, data?: any, context?: string) => logger.info(message, data, context),
  warn: (message: string, data?: any, context?: string) => logger.warn(message, data, context),
  error: (message: string, error?: any, context?: string) => logger.error(message, error, context),
  api: (method: string, url: string, data?: any) => logger.api(method, url, data),
  query: (query: string, params?: any) => logger.query(query, params),
  navigation: (screen: string, params?: any) => logger.navigation(screen, params),
  analytics: (event: string, properties?: any) => logger.analytics(event, properties),
};

export default logger;
