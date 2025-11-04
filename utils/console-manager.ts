/**
 * Console Management Utility
 *
 * Provides centralized console management for clean development experience.
 * Automatically clears console before important operations to reduce clutter.
 */

/**
 * Clear console output
 * Works in all environments (browser, React Native debugger, Node.js)
 */
export function clearConsole() {
  if (typeof console.clear === 'function') {
    console.clear();
  } else {
    // Fallback for environments without console.clear
    console.log('\x1Bc'); // ANSI escape code to clear terminal
  }
}

/**
 * Clear console and log a section header
 */
export function clearAndLog(message: string, ...args: any[]) {
  clearConsole();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${message}`);
  console.log(`${'='.repeat(60)}\n`);
  if (args.length > 0) {
    console.log(...args);
  }
}

/**
 * Clear console before a group of related logs
 */
export function startLogGroup(groupName: string) {
  clearConsole();
  console.group(groupName);
}

/**
 * End a log group
 */
export function endLogGroup() {
  console.groupEnd();
}

/**
 * Clear console before an async operation
 */
export async function clearBeforeAsync<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  clearConsole();
  if (operationName) {
    console.log(`Starting: ${operationName}`);
  }
  return await operation();
}

/**
 * Development-only console clear
 * Only clears in development environment
 */
export function clearConsoleDev() {
  if (__DEV__) {
    clearConsole();
  }
}

/**
 * Clear console with timestamp
 */
export function clearWithTimestamp(label?: string) {
  clearConsole();
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${label || 'Console Cleared'}`);
}

// Export default clear function
export default clearConsole;
