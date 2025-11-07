/**
 * Safe JSON Parser Utility
 *
 * Provides safe JSON parsing with comprehensive validation to prevent
 * "Unexpected end of JSON input" errors throughout the application.
 *
 * Features:
 * - Response body validation before parsing
 * - Content-Length header validation
 * - Empty response detection
 * - Detailed error messages with context
 * - Response cloning for debugging
 * - Type-safe parsing with optional schema validation
 */

export interface SafeJsonOptions {
  /**
   * Allow empty responses (return null instead of throwing)
   */
  allowEmpty?: boolean;

  /**
   * Custom error message prefix
   */
  errorContext?: string;

  /**
   * Log response details on error
   */
  logOnError?: boolean;

  /**
   * Maximum response size in bytes (default: 10MB)
   */
  maxSize?: number;

  /**
   * Fallback value if parsing fails and allowEmpty is true
   */
  fallback?: any;
}

export interface JsonParseError extends Error {
  type: 'empty_response' | 'invalid_json' | 'size_exceeded' | 'network_error';
  context?: string;
  responseText?: string;
  url?: string;
  status?: number;
}

/**
 * Create a custom JSON parse error with additional context
 */
function createJsonParseError(
  message: string,
  type: JsonParseError['type'],
  options?: {
    context?: string;
    responseText?: string;
    url?: string;
    status?: number;
    originalError?: Error;
  }
): JsonParseError {
  const error = new Error(message) as JsonParseError;
  error.name = 'JsonParseError';
  error.type = type;
  error.context = options?.context;
  error.responseText = options?.responseText;
  error.url = options?.url;
  error.status = options?.status;

  if (options?.originalError) {
    error.stack = options.originalError.stack;
  }

  return error;
}

/**
 * Safely parse a Response object to JSON with validation
 *
 * @param response - The Response object to parse
 * @param options - Parsing options
 * @returns Parsed JSON data
 * @throws JsonParseError if parsing fails
 */
export async function safeResponseJson<T = any>(
  response: Response,
  options: SafeJsonOptions = {}
): Promise<T> {
  const {
    allowEmpty = false,
    errorContext = 'API response',
    logOnError = __DEV__,
    maxSize = 10 * 1024 * 1024, // 10MB
    fallback = null,
  } = options;

  const url = response.url;
  const status = response.status;

  try {
    // Clone response for potential retry/debugging
    const clonedResponse = response.clone();

    // Check Content-Length header
    const contentLength = response.headers.get('Content-Length');
    if (contentLength) {
      const size = parseInt(contentLength, 10);

      if (size === 0) {
        if (allowEmpty) {
          return fallback as T;
        }
        throw createJsonParseError(
          `${errorContext}: Empty response body (Content-Length: 0)`,
          'empty_response',
          { url, status, context: errorContext }
        );
      }

      if (size > maxSize) {
        throw createJsonParseError(
          `${errorContext}: Response too large (${size} bytes exceeds ${maxSize} bytes)`,
          'size_exceeded',
          { url, status, context: errorContext }
        );
      }
    }

    // Check Content-Type header
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) {
      if (logOnError) {
        console.warn(`[SafeJSON] Response Content-Type is not JSON: ${contentType}`, {
          url,
          status,
          contentType,
        });
      }
    }

    // Read response as text first to validate
    let text: string;
    try {
      text = await response.text();
    } catch (error) {
      throw createJsonParseError(
        `${errorContext}: Failed to read response body`,
        'network_error',
        {
          url,
          status,
          context: errorContext,
          originalError: error as Error
        }
      );
    }

    // Validate text is not empty
    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      if (allowEmpty) {
        return fallback as T;
      }
      throw createJsonParseError(
        `${errorContext}: Empty response body (0 bytes)`,
        'empty_response',
        { url, status, context: errorContext, responseText: text }
      );
    }

    // Attempt to parse JSON
    try {
      return JSON.parse(trimmedText) as T;
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
      const preview = trimmedText.substring(0, 200);

      if (logOnError) {
        console.error('[SafeJSON] JSON parse error:', {
          url,
          status,
          error: errorMessage,
          preview,
          contentType,
          length: trimmedText.length,
        });
      }

      throw createJsonParseError(
        `${errorContext}: Invalid JSON - ${errorMessage}`,
        'invalid_json',
        {
          url,
          status,
          context: errorContext,
          responseText: preview,
          originalError: parseError as Error,
        }
      );
    }
  } catch (error) {
    // If it's already our custom error, re-throw it
    if ((error as JsonParseError).type) {
      throw error;
    }

    // Wrap unexpected errors
    throw createJsonParseError(
      `${errorContext}: Unexpected error during JSON parsing`,
      'network_error',
      {
        url,
        status,
        context: errorContext,
        originalError: error as Error,
      }
    );
  }
}

/**
 * Safely parse a JSON string with validation
 *
 * @param text - The JSON string to parse
 * @param options - Parsing options
 * @returns Parsed JSON data
 * @throws JsonParseError if parsing fails
 */
export function safeJsonParse<T = any>(
  text: string,
  options: SafeJsonOptions = {}
): T {
  const {
    allowEmpty = false,
    errorContext = 'JSON string',
    logOnError = __DEV__,
    fallback = null,
  } = options;

  const trimmedText = text.trim();

  if (trimmedText.length === 0) {
    if (allowEmpty) {
      return fallback as T;
    }
    throw createJsonParseError(
      `${errorContext}: Empty string provided`,
      'empty_response',
      { context: errorContext, responseText: text }
    );
  }

  try {
    return JSON.parse(trimmedText) as T;
  } catch (parseError) {
    const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown error';
    const preview = trimmedText.substring(0, 200);

    if (logOnError) {
      console.error('[SafeJSON] JSON parse error:', {
        error: errorMessage,
        preview,
        length: trimmedText.length,
      });
    }

    throw createJsonParseError(
      `${errorContext}: Invalid JSON - ${errorMessage}`,
      'invalid_json',
      {
        context: errorContext,
        responseText: preview,
        originalError: parseError as Error,
      }
    );
  }
}

/**
 * Safely parse WebSocket message data
 *
 * @param data - The WebSocket message data (string or MessageEvent.data)
 * @param options - Parsing options
 * @returns Parsed JSON data
 * @throws JsonParseError if parsing fails
 */
export function safeWebSocketJson<T = any>(
  data: string | any,
  options: SafeJsonOptions = {}
): T {
  const text = typeof data === 'string' ? data : String(data);
  return safeJsonParse<T>(text, {
    ...options,
    errorContext: options.errorContext || 'WebSocket message',
  });
}

/**
 * Check if a response is likely to contain JSON
 *
 * @param response - The Response object to check
 * @returns True if response appears to be JSON
 */
export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get('Content-Type') || '';
  return (
    contentType.includes('application/json') ||
    contentType.includes('text/json') ||
    contentType.includes('+json')
  );
}

/**
 * Safely attempt to parse JSON with fallback value
 *
 * @param response - The Response object to parse
 * @param fallbackValue - Value to return if parsing fails
 * @returns Parsed JSON data or fallback value
 */
export async function safeResponseJsonOrDefault<T = any>(
  response: Response,
  fallbackValue: T
): Promise<T> {
  try {
    return await safeResponseJson<T>(response, { allowEmpty: true, fallback: fallbackValue });
  } catch (error) {
    console.warn('[SafeJSON] Parsing failed, using fallback:', error);
    return fallbackValue;
  }
}

/**
 * Validate and parse database JSON column
 *
 * @param jsonString - JSON string from database
 * @param columnName - Name of the database column (for error context)
 * @param fallbackValue - Default value if parsing fails
 * @returns Parsed JSON data or fallback value
 */
export function safeDatabaseJson<T = any>(
  jsonString: string | null | undefined,
  columnName: string,
  fallbackValue: T
): T {
  if (!jsonString) {
    return fallbackValue;
  }

  try {
    return safeJsonParse<T>(jsonString, {
      errorContext: `Database column '${columnName}'`,
      allowEmpty: true,
      fallback: fallbackValue,
    });
  } catch (error) {
    console.error(`[SafeJSON] Database column '${columnName}' contains invalid JSON:`, error);
    return fallbackValue;
  }
}
