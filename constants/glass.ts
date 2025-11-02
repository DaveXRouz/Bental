import { palette, shadows, colors } from './theme';

export const GLASS = {
  bg: 'rgba(255, 255, 255, 0.08)',
  bgMedium: 'rgba(255, 255, 255, 0.12)',
  bgHeavy: 'rgba(255, 255, 255, 0.18)',
  bgDark: 'rgba(0, 0, 0, 0.3)',
  border: 'rgba(255, 255, 255, 0.15)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderDark: 'rgba(255, 255, 255, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  text: colors.white,
  white: colors.white,
  black: colors.black,
  danger: '#EF4444',
  radius: 16,
  radiusLg: 20,
  blur: 20,
  blurHeavy: 40,
  spacing: 8,
};

export const GLASS_VARIANTS = {
  light: {
    background: GLASS.bg,
    border: GLASS.borderLight,
    gradient: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'],
  },
  medium: {
    background: GLASS.bgMedium,
    border: GLASS.border,
    gradient: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'],
  },
  heavy: {
    background: GLASS.bgHeavy,
    border: GLASS.border,
    gradient: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.10)'],
  },
  dark: {
    background: GLASS.bgDark,
    border: GLASS.borderDark,
    gradient: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'],
  },
};

export const GLASS_SHADOWS = {
  sm: shadows.sm,
  md: shadows.md,
  lg: shadows.lg,
  glass: shadows.glass,
  glass3D: shadows.glass3D || shadows.glass,
  elevated: shadows.elevated || shadows.lg,
};

export const GLASS_3D = {
  card: {
    backgroundColor: GLASS.bg,
    borderWidth: 1,
    borderColor: GLASS.border,
    ...GLASS_SHADOWS.glass3D,
  },
  elevated: {
    backgroundColor: GLASS.bgMedium,
    borderWidth: 1.5,
    borderColor: GLASS.border,
    ...GLASS_SHADOWS.elevated,
  },
  subtle: {
    backgroundColor: GLASS.bg,
    borderWidth: 1,
    borderColor: GLASS.borderLight,
    ...GLASS_SHADOWS.md,
  },
};
