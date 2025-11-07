/**
 * Unified API Client
 *
 * Centralized HTTP client with interceptors for:
 * - Authentication headers
 * - Request/response logging
 * - Error handling and mapping
 * - Rate limiting
 * - Request cancellation
 * - Circuit breaker pattern
 * - Safe JSON parsing with validation
 */

import { supabase } from './supabase';
import { safeResponseJson, safeResponseJsonOrDefault, isJsonResponse } from '@/utils/safe-json-parser';

export interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  circuitBreaker?: boolean;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private defaultHeaders: Record<string, string>;
  private requestInterceptors: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>> = [];
  private responseInterceptors: Array<(response: Response) => Response | Promise<Response>> = [];
  private errorInterceptors: Array<(error: ApiError) => ApiError | Promise<ApiError>> = [];

  // Circuit breaker state
  private circuitState: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private failureThreshold = 5;
  private resetTimeout: NodeJS.Timeout | null = null;

  // Request queue for rate limiting
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 100; // ms between requests

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.timeout = config.timeout || 30000;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add default interceptors
    this.addRequestInterceptor(this.authInterceptor.bind(this));
    this.addRequestInterceptor(this.loggingInterceptor.bind(this));
    this.addResponseInterceptor(this.responseLoggingInterceptor.bind(this));
    this.addErrorInterceptor(this.errorMappingInterceptor.bind(this));
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>) {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Authentication interceptor - adds JWT token
   */
  private async authInterceptor(config: RequestConfig): Promise<RequestConfig> {
    if (config.skipAuth) {
      return config;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${session.access_token}`,
        };
      }
    } catch (error) {
      console.warn('Failed to add auth token:', error);
    }

    return config;
  }

  /**
   * Logging interceptor - logs requests in dev mode
   */
  private loggingInterceptor(config: RequestConfig): RequestConfig {
    if (__DEV__) {
      console.log('[API Request]', {
        url: config.url || 'unknown',
        method: config.method || 'GET',
        headers: config.headers,
      });
    }
    return config;
  }

  /**
   * Response logging interceptor
   */
  private responseLoggingInterceptor(response: Response): Response {
    if (__DEV__) {
      console.log('[API Response]', {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
      });
    }
    return response;
  }

  /**
   * Error mapping interceptor - converts API errors to user-friendly messages
   */
  private errorMappingInterceptor(error: ApiError): ApiError {
    const errorMap: Record<string, string> = {
      'NETWORK_ERROR': 'Unable to connect. Please check your internet connection.',
      'TIMEOUT': 'Request timed out. Please try again.',
      'UNAUTHORIZED': 'You need to log in to access this resource.',
      'FORBIDDEN': 'You do not have permission to access this resource.',
      'NOT_FOUND': 'The requested resource was not found.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'RATE_LIMIT': 'Too many requests. Please wait a moment.',
    };

    if (error.code && errorMap[error.code]) {
      error.message = errorMap[error.code];
    }

    return error;
  }

  /**
   * Circuit breaker check
   */
  private async checkCircuitBreaker(): Promise<void> {
    if (this.circuitState === 'open') {
      throw {
        message: 'Service temporarily unavailable. Please try again later.',
        code: 'CIRCUIT_OPEN',
        status: 503,
      } as ApiError;
    }
  }

  /**
   * Handle circuit breaker state
   */
  private handleCircuitBreaker(success: boolean) {
    if (success) {
      this.failureCount = 0;
      if (this.circuitState === 'half-open') {
        this.circuitState = 'closed';
        if (this.resetTimeout) {
          clearTimeout(this.resetTimeout);
          this.resetTimeout = null;
        }
      }
    } else {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.circuitState = 'open';

        // Reset after 60 seconds
        this.resetTimeout = setTimeout(() => {
          this.circuitState = 'half-open';
          this.failureCount = 0;
        }, 60000);
      }
    }
  }

  /**
   * Execute request with timeout
   */
  private async executeWithTimeout(
    url: string,
    config: RequestConfig
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          code: 'TIMEOUT',
          status: 408,
        } as ApiError;
      }
      throw error;
    }
  }

  /**
   * Main request method
   */
  async request<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    // Apply circuit breaker if enabled
    if (config.circuitBreaker !== false) {
      await this.checkCircuitBreaker();
    }

    // Merge headers
    config.headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    // Apply request interceptors
    let finalConfig = config;
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // Build full URL
    const fullURL = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    finalConfig.url = fullURL;

    try {
      // Execute request
      let response = await this.executeWithTimeout(fullURL, finalConfig);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      // Check response status
      if (!response.ok) {
        const error: ApiError = {
          message: response.statusText || 'Request failed',
          status: response.status,
        };

        // Map status codes to error codes
        if (response.status === 401) error.code = 'UNAUTHORIZED';
        if (response.status === 403) error.code = 'FORBIDDEN';
        if (response.status === 404) error.code = 'NOT_FOUND';
        if (response.status === 429) error.code = 'RATE_LIMIT';
        if (response.status >= 500) error.code = 'SERVER_ERROR';

        // Try to parse error body safely
        try {
          const errorData = await safeResponseJson(response.clone(), {
            allowEmpty: true,
            errorContext: `Error response from ${fullURL}`,
            logOnError: false,
          });
          if (errorData) {
            error.details = errorData;
            if (errorData.message) error.message = errorData.message;
          }
        } catch (e) {
          // Error response is not JSON, try to read as text
          try {
            const errorText = await response.clone().text();
            if (errorText && errorText.trim().length > 0) {
              error.details = { rawError: errorText.substring(0, 500) };
            }
          } catch (textError) {
            // Ignore text parse errors
          }
        }

        throw error;
      }

      // Update circuit breaker on success
      if (config.circuitBreaker !== false) {
        this.handleCircuitBreaker(true);
      }

      // Parse response safely
      if (isJsonResponse(response)) {
        try {
          return await safeResponseJson<T>(response, {
            errorContext: `Response from ${fullURL}`,
            logOnError: true,
            allowEmpty: false,
          });
        } catch (jsonError: any) {
          console.error('[API Client] JSON parse error:', {
            url: fullURL,
            status: response.status,
            error: jsonError.message,
            type: jsonError.type,
          });

          // If JSON parsing failed but response was OK, throw detailed error
          throw {
            message: `Failed to parse JSON response: ${jsonError.message}`,
            code: 'JSON_PARSE_ERROR',
            status: response.status,
            details: {
              url: fullURL,
              parseError: jsonError.message,
              responsePreview: jsonError.responseText,
            },
          } as ApiError;
        }
      }

      // Non-JSON response, return as text
      return await response.text() as any;

    } catch (error: any) {
      // Update circuit breaker on failure
      if (config.circuitBreaker !== false) {
        this.handleCircuitBreaker(false);
      }

      // Convert to ApiError
      let apiError: ApiError = {
        message: error.message || 'Network error',
        code: error.code || 'NETWORK_ERROR',
        status: error.status,
        details: error.details,
      };

      // Apply error interceptors
      for (const interceptor of this.errorInterceptors) {
        apiError = await interceptor(apiError);
      }

      throw apiError;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;
