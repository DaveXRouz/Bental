import { Dimensions, Platform } from 'react-native';
import { breakpoints } from '@/constants/theme';

export function getScreenDimensions() {
  return Dimensions.get('window');
}

export function isTabletSize(width: number = Dimensions.get('window').width): boolean {
  return width >= breakpoints.tablet && width < breakpoints.desktop;
}

export function isMobileSize(width: number = Dimensions.get('window').width): boolean {
  return width < breakpoints.tablet;
}

export function isDesktopSize(width: number = Dimensions.get('window').width): boolean {
  return width >= breakpoints.desktop;
}

export function getBreakpoint(width: number = Dimensions.get('window').width): 'mobile' | 'tablet' | 'desktop' {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function scaleSize(size: number, width: number = Dimensions.get('window').width): number {
  const baseWidth = 375;
  const scale = width / baseWidth;
  return Math.round(size * scale);
}

export function responsiveSpacing(base: number, width: number = Dimensions.get('window').width): number {
  if (isDesktopSize(width)) return base * 1.5;
  if (isTabletSize(width)) return base * 1.25;
  return base;
}

export function responsiveFontSize(base: number, width: number = Dimensions.get('window').width): number {
  if (isDesktopSize(width)) return base * 1.2;
  if (isTabletSize(width)) return base * 1.1;
  return base;
}

export function responsivePadding(width: number = Dimensions.get('window').width): number {
  if (isDesktopSize(width)) return 48;
  if (isTabletSize(width)) return 32;
  return 16;
}

export function getGridColumns(width: number = Dimensions.get('window').width): number {
  if (isDesktopSize(width)) return 12;
  if (isTabletSize(width)) return 8;
  return 4;
}

export function getContentMaxWidth(
  width: number = Dimensions.get('window').width,
  breakpoint?: 'mobile' | 'tablet' | 'desktop'
): number {
  const bp = breakpoint || getBreakpoint(width);

  if (bp === 'desktop') return 1200;
  if (bp === 'tablet') return 768;
  return 480;
}

export function shouldUseCompactLayout(width: number = Dimensions.get('window').width): boolean {
  return width < 600;
}

export const responsiveStyles = {
  flexContainer: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    minHeight: 0,
  },

  flexItem: {
    flexShrink: 1,
    minWidth: 0,
  },

  fixedSize: {
    flexGrow: 0,
    flexShrink: 0,
  },

  absoluteContainer: {
    position: 'absolute' as const,
    overflow: 'hidden',
  },

  scrollContainer: {
    flex: 1,
    minWidth: 0,
  },

  centeredContent: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
