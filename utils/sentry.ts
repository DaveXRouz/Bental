type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

interface Breadcrumb {
  message?: string;
  category?: string;
  level?: SeverityLevel;
  data?: Record<string, any>;
}

export function captureException(error: Error, context?: Record<string, any>) {
  // Logging disabled for production
}

export function captureMessage(message: string, level: SeverityLevel = 'info', context?: Record<string, any>) {
  // Logging disabled for production
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  // Logging disabled for production
}

export function clearUser() {
  // Logging disabled for production
}

export function addBreadcrumb(breadcrumb: Breadcrumb) {
  // Logging disabled for production
}

export const Sentry = {
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
};
