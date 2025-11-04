import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { clearConsole } from '@/utils/console-manager';

/**
 * RouteChangeListener Component
 *
 * Automatically clears console output when navigating between screens.
 * This ensures clean console output for each screen without clutter.
 *
 * Usage: Place in root layout or tabs layout
 *
 * @example
 * ```tsx
 * export default function Layout() {
 *   return (
 *     <>
 *       <RouteChangeListener />
 *       <Stack>
 *         {/* Your screens *\/}
 *       </Stack>
 *     </>
 *   );
 * }
 * ```
 */
export function RouteChangeListener() {
  const pathname = usePathname();

  useEffect(() => {
    // Clear console when route changes
    clearConsole();

    // Log current route in development
    if (__DEV__) {
      console.log(`📍 Navigated to: ${pathname}`);
    }
  }, [pathname]);

  return null;
}
