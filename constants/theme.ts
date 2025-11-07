export const colors = {
  black: '#000000',
  white: '#FFFFFF',

  grey: {
    900: '#0A0A0A',
    800: '#111111',
    700: '#1A1A1A',
    600: '#2A2A2A',
    500: '#3A3A3A',
    400: '#6B6B6B',
    300: '#BDBDBD',
    200: '#E5E5E5',
    100: '#F8F8F8',
  },

  accent: '#3B82F6',
  accentDark: '#1E40AF',

  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  primary: '#FFFFFF',
  primaryLight: '#F8F8F8',
  secondary: '#BDBDBD',

  background: '#000000',
  surface: '#0A0A0A',
  surfaceAlt: '#111111',
  surfaceHighlight: '#2A2A2A',
  border: '#1A1A1A',

  text: '#FFFFFF',
  textSecondary: '#BDBDBD',
  textMuted: '#6B6B6B',
  textTertiary: '#6B6B6B',
  textInverse: '#000000',

  overlay: 'rgba(0, 0, 0, 0.85)',
  glassBackground: 'rgba(10, 10, 10, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.05)',

  glass: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    heavy: 'rgba(255, 255, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderLight: 'rgba(255, 255, 255, 0.08)',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};

export const typography = {
  family: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    display: 'Playfair-Display',
  },
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
    display: 28,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  numeric: {
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      relaxed: 0.5,
    },
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.5,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glass3D: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10,
    elevation: 16,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16,
    elevation: 24,
  },
};

export const glassMorphism = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  subtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
};

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

export const blur = {
  sm: 12,
  md: 20,
  lg: 24,
  xl: 40,
};

export const zIndex = {
  base: 0,
  background: 0,
  content: 5,
  fab: 40,
  tabBar: 60,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  toast: 600,
};

export const layout = {
  tabBar: {
    height: 72,
    heightIOS: 72,
    heightAndroid: 72,
    paddingBottomIOS: 32,
    paddingBottomAndroid: 16,
  },
  fab: {
    size: 60,
    bottomOffsetIOS: 92,
    bottomOffsetAndroid: 82,
  },
  safeArea: {
    top: 60,
    bottom: 0,
  },
};

export const animation = {
  timing: {
    fast: 150,
    normal: 200,
    slow: 220,
    ultraSlow: 300,
  },
  easing: 'ease-in-out' as const,
  floating: {
    duration: 8000,
    distance: 30,
  },
  rotation: {
    duration: 50000,
  },
  scale: {
    min: 1,
    max: 1.15,
    duration: 7000,
  },
  opacity: {
    min: 0.25,
    max: 0.5,
    duration: 6000,
  },
};

export const touchTarget = {
  min: 44,
};

export const grid = {
  base: 8,
  columns: 12,
  gutter: 16,
};

export const breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

export const theme = {
  colors,
  radius,
  spacing,
  typography,
  shadows,
  zIndex,
  animation,
  touchTarget,
  grid,
  breakpoints,
};

export type Theme = typeof theme;

export const Spacing = spacing;
export const Typography = typography;
export const BorderRadius = radius;
export const Shadows = shadows;
export const ZIndex = zIndex;
export const Animation = animation;

export const Colors = {
  dark: {
    ...colors,
    primary: colors.white,
    primaryLight: colors.white,
    secondary: colors.textSecondary,
    bg: colors.background,
    surface: colors.surfaceAlt,
    surfaceAlt: colors.surfaceAlt,
    surfaceElevated: colors.grey[700],
    surfaceHighlight: colors.grey[600],
    border: colors.border,
    borderLight: colors.glassBorder,
    textPrimary: colors.text,
    textSecondary: colors.textSecondary,
    textTertiary: colors.textMuted,
    textInverse: colors.textInverse,
    primaryDark: '#DDDDDD',
    secondaryDark: '#999999',
    error: colors.danger,
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    lineHair: colors.glassBorder,
  },
  light: {
    primary: '#000000',
    primaryLight: '#F8F8F8',
    secondary: '#A0A0A0',
    background: '#FFFFFF',
    bg: '#FFFFFF',
    surface: '#F8F8F8',
    surfaceAlt: '#E5E5E5',
    surfaceElevated: '#F0F0F0',
    surfaceHighlight: '#FAFAFA',
    border: 'rgba(0,0,0,0.10)',
    borderLight: 'rgba(0,0,0,0.05)',
    text: '#000000',
    textPrimary: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textMuted: '#999999',
    textInverse: '#FFFFFF',
    accent: '#3B82F6',
    success: '#10B981',
    danger: '#EF4444',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export const palette = {
  ...colors,
  monoBlack: colors.black,
  monoWhite: colors.white,
  primaryLight: colors.white,
  lineHair: colors.glassBorder,
  error: colors.danger,
  bg: colors.background,
  textPrimary: colors.text,
  glassLight: 'rgba(255,255,255,0.05)',
  glassDark: 'rgba(0,0,0,0.3)',
};

export const radii = {
  ...radius,
  card: radius.lg,
  modal: radius.xl,
  pill: 28,
};

export const Blur = {
  sm: 12,
  md: 18,
  lg: 24,
};

export const VerifiedBadgeSize = {
  sm: 16,
  md: 20,
  lg: 24,
};

export const ACCENT_GRADIENT = ['#22D3EE', '#3B82F6'];

export default theme;
