import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { breakpoints } from '@/constants/theme';

export interface ResponsiveValues {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  scale: number;
  spacing: (base: number) => number;
  fontSize: (base: number) => number;
}

export function useResponsive(): ResponsiveValues {
  const { width, height } = useWindowDimensions();

  const values = useMemo(() => {
    const isMobile = width < breakpoints.tablet;
    const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
    const isDesktop = width >= breakpoints.desktop;

    const breakpoint: 'mobile' | 'tablet' | 'desktop' =
      isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';

    const scale = Math.min(width / 375, 1.5);

    const spacing = (base: number) => {
      if (isDesktop) return base * 1.5;
      if (isTablet) return base * 1.25;
      return base;
    };

    const fontSize = (base: number) => {
      if (isDesktop) return base * 1.2;
      if (isTablet) return base * 1.1;
      return base;
    };

    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      breakpoint,
      scale,
      spacing,
      fontSize,
    };
  }, [width, height]);

  return values;
}

export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    if (width >= breakpoints.desktop) return 'desktop';
    if (width >= breakpoints.tablet) return 'tablet';
    return 'mobile';
  }, [width]);
}

export function useIsMobile(): boolean {
  const { width } = useWindowDimensions();
  return useMemo(() => width < breakpoints.tablet, [width]);
}

export function useIsTablet(): boolean {
  const { width } = useWindowDimensions();
  return useMemo(() => width >= breakpoints.tablet && width < breakpoints.desktop, [width]);
}

export function useIsDesktop(): boolean {
  const { width } = useWindowDimensions();
  return useMemo(() => width >= breakpoints.desktop, [width]);
}

export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return useMemo(() => {
    if (isDesktop && values.desktop !== undefined) return values.desktop;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    return values.mobile;
  }, [isMobile, isTablet, isDesktop, values]);
}
