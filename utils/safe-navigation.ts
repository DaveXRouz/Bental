/**
 * Safe Navigation Utility
 * Provides defensive wrappers for navigation operations with error handling
 */

import { router } from 'expo-router';

interface NavigationOptions {
  fallbackRoute?: string;
  logErrors?: boolean;
  beforeNavigate?: () => void | Promise<void>;
}

/**
 * Safely navigate to a route with error handling
 */
export function safeNavigate(
  route: string,
  options: NavigationOptions = {}
): boolean {
  const {
    fallbackRoute = '/(auth)/login',
    logErrors = true,
    beforeNavigate,
  } = options;

  try {
    // Validate route format
    if (!route || typeof route !== 'string') {
      if (logErrors) {
        console.error('[SafeNavigation] Invalid route:', route);
      }
      return false;
    }

    // Check for invalid URLs (WebContainer, chrome-extension, etc.)
    if (
      route.includes('webcontainer') ||
      route.includes('chrome-extension') ||
      route.includes('localhost') && route.includes(':8081')
    ) {
      if (logErrors) {
        console.warn('[SafeNavigation] Blocked navigation to invalid URL:', route);
      }
      return false;
    }

    // Execute pre-navigation hook
    if (beforeNavigate) {
      const result = beforeNavigate();
      if (result instanceof Promise) {
        result.catch((err) => {
          if (logErrors) {
            console.error('[SafeNavigation] beforeNavigate hook failed:', err);
          }
        });
      }
    }

    // Attempt navigation
    router.push(route as any);
    return true;
  } catch (error) {
    if (logErrors) {
      console.error('[SafeNavigation] Navigation failed:', error);
    }

    // Try fallback route
    if (fallbackRoute && fallbackRoute !== route) {
      try {
        router.push(fallbackRoute as any);
        return true;
      } catch (fallbackError) {
        if (logErrors) {
          console.error('[SafeNavigation] Fallback navigation also failed:', fallbackError);
        }
      }
    }

    return false;
  }
}

/**
 * Safely replace the current route with error handling
 */
export function safeReplace(
  route: string,
  options: NavigationOptions = {}
): boolean {
  const {
    fallbackRoute = '/(auth)/login',
    logErrors = true,
    beforeNavigate,
  } = options;

  try {
    // Validate route format
    if (!route || typeof route !== 'string') {
      if (logErrors) {
        console.error('[SafeNavigation] Invalid route for replace:', route);
      }
      return false;
    }

    // Check for invalid URLs
    if (
      route.includes('webcontainer') ||
      route.includes('chrome-extension') ||
      route.includes('localhost') && route.includes(':8081')
    ) {
      if (logErrors) {
        console.warn('[SafeNavigation] Blocked replace to invalid URL:', route);
      }
      return false;
    }

    // Execute pre-navigation hook
    if (beforeNavigate) {
      const result = beforeNavigate();
      if (result instanceof Promise) {
        result.catch((err) => {
          if (logErrors) {
            console.error('[SafeNavigation] beforeNavigate hook failed:', err);
          }
        });
      }
    }

    // Attempt replace
    router.replace(route as any);
    return true;
  } catch (error) {
    if (logErrors) {
      console.error('[SafeNavigation] Replace failed:', error);
    }

    // Try fallback route
    if (fallbackRoute && fallbackRoute !== route) {
      try {
        router.replace(fallbackRoute as any);
        return true;
      } catch (fallbackError) {
        if (logErrors) {
          console.error('[SafeNavigation] Fallback replace also failed:', fallbackError);
        }
      }
    }

    return false;
  }
}

/**
 * Safely go back with error handling
 */
export function safeBack(options: { logErrors?: boolean } = {}): boolean {
  const { logErrors = true } = options;

  try {
    if (router.canGoBack()) {
      router.back();
      return true;
    } else {
      if (logErrors) {
        console.warn('[SafeNavigation] Cannot go back, no history available');
      }
      return false;
    }
  } catch (error) {
    if (logErrors) {
      console.error('[SafeNavigation] Back navigation failed:', error);
    }
    return false;
  }
}

/**
 * Check if a route is valid for navigation
 */
export function isValidRoute(route: string): boolean {
  if (!route || typeof route !== 'string') {
    return false;
  }

  // Block invalid URLs
  const invalidPatterns = [
    'webcontainer',
    'chrome-extension',
    'moz-extension',
    'ms-browser-extension',
    'javascript:',
    'data:',
    'file:',
  ];

  return !invalidPatterns.some((pattern) => route.includes(pattern));
}

/**
 * Safely navigate with console clearing
 */
export function safeNavigateWithClear(
  route: string,
  options: NavigationOptions = {}
): boolean {
  console.clear();
  return safeNavigate(route, options);
}

/**
 * Safely replace with console clearing
 */
export function safeReplaceWithClear(
  route: string,
  options: NavigationOptions = {}
): boolean {
  console.clear();
  return safeReplace(route, options);
}
