type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

interface Breadcrumb {
  message?: string;
  category?: string;
  level?: SeverityLevel;
  data?: Record<string, any>;
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (__DEV__) {
    console.error('Error:', error, context);
    return;
  }
  console.error('Production Error:', error, context);
}

export function captureMessage(message: string, level: SeverityLevel = 'info', context?: Record<string, any>) {
  if (__DEV__) {
    console.log(`Message [${level}]:`, message, context);
    return;
  }
  console.log(`Production Message [${level}]:`, message, context);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  if (__DEV__) {
    console.log('User set:', user);
  }
}

export function clearUser() {
  if (__DEV__) {
    console.log('User cleared');
  }
}

export function addBreadcrumb(breadcrumb: Breadcrumb) {
  if (__DEV__) {
    console.log('Breadcrumb:', breadcrumb);
  }
}

export const Sentry = {
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
};
