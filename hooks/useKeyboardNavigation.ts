import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';

interface UseKeyboardNavigationOptions {
  onEnter?: () => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onEnter,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Enter':
          onEnter?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onArrowRight?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);
}

interface UseListKeyboardNavigationOptions<T> {
  items: T[];
  onSelect: (item: T, index: number) => void;
  loop?: boolean;
  initialIndex?: number;
  enabled?: boolean;
}

export function useListKeyboardNavigation<T>({
  items,
  onSelect,
  loop = true,
  initialIndex = -1,
  enabled = true,
}: UseListKeyboardNavigationOptions<T>) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev <= 0) {
        return loop ? items.length - 1 : 0;
      }
      return prev - 1;
    });
  }, [items.length, loop]);

  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev >= items.length - 1) {
        return loop ? 0 : items.length - 1;
      }
      return prev + 1;
    });
  }, [items.length, loop]);

  const selectCurrent = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      onSelect(items[selectedIndex], selectedIndex);
    }
  }, [selectedIndex, items, onSelect]);

  useKeyboardNavigation({
    onArrowUp: moveUp,
    onArrowDown: moveDown,
    onEnter: selectCurrent,
    enabled,
  });

  return {
    selectedIndex,
    setSelectedIndex,
    moveUp,
    moveDown,
    selectCurrent,
  };
}

export function useFocusManagement() {
  const elementRefs = useRef<Map<string, any>>(new Map());

  const register = useCallback((id: string, ref: any) => {
    if (ref) {
      elementRefs.current.set(id, ref);
    } else {
      elementRefs.current.delete(id);
    }
  }, []);

  const focus = useCallback((id: string) => {
    const element = elementRefs.current.get(id);
    if (element) {
      if (Platform.OS === 'web' && element.focus) {
        element.focus();
      }
    }
  }, []);

  const focusNext = useCallback((currentId: string) => {
    const ids = Array.from(elementRefs.current.keys());
    const currentIndex = ids.indexOf(currentId);
    const nextIndex = (currentIndex + 1) % ids.length;
    focus(ids[nextIndex]);
  }, [focus]);

  const focusPrevious = useCallback((currentId: string) => {
    const ids = Array.from(elementRefs.current.keys());
    const currentIndex = ids.indexOf(currentId);
    const prevIndex = currentIndex === 0 ? ids.length - 1 : currentIndex - 1;
    focus(ids[prevIndex]);
  }, [focus]);

  return {
    register,
    focus,
    focusNext,
    focusPrevious,
  };
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
    enabled?: boolean;
  } = {}
) {
  const {
    ctrl = false,
    meta = false,
    shift = false,
    alt = false,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const matchesModifiers =
        e.ctrlKey === ctrl &&
        e.metaKey === meta &&
        e.shiftKey === shift &&
        e.altKey === alt;

      const matchesKey =
        e.key.toLowerCase() === key.toLowerCase() ||
        e.code.toLowerCase() === key.toLowerCase();

      if (matchesKey && matchesModifiers) {
        e.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [key, ctrl, meta, shift, alt, enabled, callback]);
}

export function useEscapeKey(callback: () => void, enabled = true) {
  useKeyboardNavigation({
    onEscape: callback,
    enabled,
  });
}

export function useEnterKey(callback: () => void, enabled = true) {
  useKeyboardNavigation({
    onEnter: callback,
    enabled,
  });
}
