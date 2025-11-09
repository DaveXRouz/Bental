/**
 * Centralized Error Management System
 * Categorizes, filters, and manages errors throughout the application
 */

export enum ErrorCategory {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
  EXTENSION = 'extension',
  SUPPRESSED = 'suppressed',
}

export enum ErrorSource {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  NETWORK = 'network',
  NAVIGATION = 'navigation',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

interface CategorizedError {
  category: ErrorCategory;
  source: ErrorSource;
  message: string;
  originalError: any;
  timestamp: number;
  shouldDisplay: boolean;
  userMessage?: string;
}

/**
 * Categorize an error based on its content and context
 */
export function categorizeError(
  error: any,
  context?: string
): CategorizedError {
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || String(error);

  // Browser extension errors - always suppress
  if (
    errorMessage.includes('chrome-extension') ||
    errorMessage.includes('Invalid argument not valid semver') ||
    errorMessage.includes('moz-extension') ||
    errorMessage.includes('ms-browser-extension')
  ) {
    return {
      category: ErrorCategory.EXTENSION,
      source: ErrorSource.UNKNOWN,
      message: errorMessage,
      originalError: error,
      timestamp: Date.now(),
      shouldDisplay: false,
    };
  }

  // React Native Web warnings - suppress
  if (
    errorMessage.includes('text node cannot be a child') ||
    errorMessage.includes('Unexpected text node')
  ) {
    return {
      category: ErrorCategory.SUPPRESSED,
      source: ErrorSource.UNKNOWN,
      message: errorMessage,
      originalError: error,
      timestamp: Date.now(),
      shouldDisplay: false,
    };
  }

  // Authentication errors
  if (
    errorMessage.includes('Invalid login credentials') ||
    errorMessage.includes('Invalid') ||
    errorMessage.includes('password') ||
    errorMessage.includes('authentication')
  ) {
    return {
      category: ErrorCategory.WARNING,
      source: ErrorSource.AUTHENTICATION,
      message: errorMessage,
      originalError: error,
      timestamp: Date.now(),
      shouldDisplay: true,
      userMessage: 'Authentication failed. Please check your credentials.',
    };
  }

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('Connection') ||
    errorMessage.includes('ECONNREFUSED')
  ) {
    return {
      category: ErrorCategory.WARNING,
      source: ErrorSource.NETWORK,
      message: errorMessage,
      originalError: error,
      timestamp: Date.now(),
      shouldDisplay: true,
      userMessage: 'Connection error. Please check your internet connection.',
    };
  }

  // Database errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('schema') ||
    errorMessage.includes('relation') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('PostgrestError')
  ) {
    return {
      category: ErrorCategory.WARNING,
      source: ErrorSource.DATABASE,
      message: errorMessage,
      originalError: error,
      timestamp: Date.now(),
      shouldDisplay: true,
      userMessage: 'Server error. Please try again in a moment.',
    };
  }

  // Navigation errors
  if (
    errorMessage.includes('Cannot navigate') ||
    errorMessage.includes('navigation') ||
    errorMessage.includes('router')
  ) {
    return {
      category: ErrorCategory.DEBUG,
      source: ErrorSource.NAVIGATION,
      message: errorMessage,
      originalError: error,
      timestamp: Date.now(),
      shouldDisplay: false,
    };
  }

  // Validation errors
  if (
    errorMessage.includes('required') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('must be')
  ) {
    return {
      category: ErrorCategory.INFO,
      source: ErrorSource.VALIDATION,
      message: errorMessage,
      originalError: error,
      timestamp: Date.now(),
      shouldDisplay: true,
      userMessage: errorMessage,
    };
  }

  // Unknown/generic errors
  return {
    category: ErrorCategory.WARNING,
    source: ErrorSource.UNKNOWN,
    message: errorMessage,
    originalError: error,
    timestamp: Date.now(),
    shouldDisplay: true,
    userMessage: 'An error occurred. Please try again.',
  };
}

/**
 * Check if an error should be suppressed (not logged to console)
 */
export function shouldSuppressError(error: any): boolean {
  const categorized = categorizeError(error);
  return (
    categorized.category === ErrorCategory.SUPPRESSED ||
    categorized.category === ErrorCategory.EXTENSION
  );
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyMessage(error: any): string {
  const categorized = categorizeError(error);
  return categorized.userMessage || 'An error occurred. Please try again.';
}

/**
 * Log an error with appropriate severity
 */
export function logError(
  error: any,
  context?: string,
  additionalData?: any
): void {
  const categorized = categorizeError(error, context);

  // Don't log suppressed or extension errors
  if (!categorized.shouldDisplay) {
    return;
  }

  const logData = {
    category: categorized.category,
    source: categorized.source,
    context,
    message: categorized.message,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  switch (categorized.category) {
    case ErrorCategory.CRITICAL:
      console.error('[ERROR:CRITICAL]', logData);
      break;
    case ErrorCategory.WARNING:
      console.warn('[ERROR:WARNING]', logData);
      break;
    case ErrorCategory.INFO:
      console.info('[ERROR:INFO]', logData);
      break;
    case ErrorCategory.DEBUG:
      console.debug('[ERROR:DEBUG]', logData);
      break;
    default:
      console.log('[ERROR]', logData);
  }
}

/**
 * Error handler for global error catching
 */
export function handleGlobalError(
  error: any,
  errorInfo?: any
): CategorizedError {
  const categorized = categorizeError(error);

  if (categorized.shouldDisplay) {
    logError(error, 'Global Error Handler', errorInfo);
  }

  return categorized;
}

/**
 * Throttle error logging to prevent console spam
 */
class ErrorThrottler {
  private errorCounts: Map<string, { count: number; lastSeen: number }> =
    new Map();
  private readonly maxCount = 3;
  private readonly windowMs = 10000; // 10 seconds

  shouldLog(errorMessage: string): boolean {
    const now = Date.now();
    const existing = this.errorCounts.get(errorMessage);

    if (!existing) {
      this.errorCounts.set(errorMessage, { count: 1, lastSeen: now });
      return true;
    }

    // Reset if outside window
    if (now - existing.lastSeen > this.windowMs) {
      this.errorCounts.set(errorMessage, { count: 1, lastSeen: now });
      return true;
    }

    // Increment count
    existing.count++;
    existing.lastSeen = now;

    // Only log first maxCount occurrences
    if (existing.count <= this.maxCount) {
      return true;
    }

    // Log summary message on maxCount + 1
    if (existing.count === this.maxCount + 1) {
      console.warn(
        `[ErrorThrottler] Suppressing further instances of: "${errorMessage.substring(0, 50)}..."`
      );
    }

    return false;
  }

  reset(): void {
    this.errorCounts.clear();
  }
}

export const errorThrottler = new ErrorThrottler();

/**
 * Safe wrapper for async operations with error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options: {
    fallback?: T;
    context?: string;
    onError?: (error: any) => void;
  } = {}
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const categorized = categorizeError(error, options.context);

    if (categorized.shouldDisplay) {
      logError(error, options.context);
    }

    if (options.onError) {
      options.onError(error);
    }

    return options.fallback;
  }
}
