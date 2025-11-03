import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
}

/**
 * Hook to register keyboard shortcuts
 *
 * Only works on web platform. Does nothing on native platforms.
 *
 * @param shortcuts - Array of keyboard shortcuts to register
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 's',
 *     ctrl: true,
 *     description: 'Save',
 *     action: handleSave,
 *   },
 *   {
 *     key: '/',
 *     description: 'Search',
 *     action: openSearch,
 *   },
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeShortcuts = shortcutsRef.current.filter(
        (shortcut) => shortcut.enabled !== false
      );

      for (const shortcut of activeShortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const metaMatches = shortcut.meta ? event.metaKey : true;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}

/**
 * Global keyboard shortcuts
 */
export const GLOBAL_SHORTCUTS = {
  SEARCH: { key: '/', description: 'Open search' },
  HELP: { key: '?', description: 'Show keyboard shortcuts' },
  CLOSE: { key: 'Escape', description: 'Close dialog/modal' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh' },
  HOME: { key: 'h', ctrl: true, description: 'Go to home' },
  PORTFOLIO: { key: 'p', ctrl: true, description: 'Go to portfolio' },
  MARKETS: { key: 'm', ctrl: true, description: 'Go to markets' },
  TRADE: { key: 't', ctrl: true, description: 'Open trade dialog' },
};

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: Partial<KeyboardShortcut>): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(Platform.OS === 'ios' ? '⌘' : 'Ctrl');
  if (shortcut.alt) parts.push(Platform.OS === 'ios' ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(Platform.OS === 'ios' ? '⇧' : 'Shift');
  if (shortcut.meta) parts.push('⌘');

  if (shortcut.key) {
    parts.push(shortcut.key.toUpperCase());
  }

  return parts.join('+');
}
