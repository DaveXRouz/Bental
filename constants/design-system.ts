export const DesignSystem = {
  colors: {
    brand: {
      primary: '#00F5D4',
      secondary: '#00D1FF',
      tertiary: '#60FFDA',
    },
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0A0A0A',
    },
    semantic: {
      success: '#19C37D',
      warning: '#FFB020',
      error: '#FF4D4D',
      info: '#00D1FF',
    },
    surface: {
      background: '#0B0F14',
      card: 'rgba(255, 255, 255, 0.06)',
      cardElevated: 'rgba(255, 255, 255, 0.08)',
      overlay: 'rgba(0, 0, 0, 0.85)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.64)',
      tertiary: 'rgba(255, 255, 255, 0.44)',
      disabled: 'rgba(255, 255, 255, 0.32)',
      inverse: '#0B1621',
    },
    border: {
      default: 'rgba(255, 255, 255, 0.12)',
      subtle: 'rgba(255, 255, 255, 0.08)',
      focus: 'rgba(0, 245, 212, 0.4)',
    },
  },

  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
  },

  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semibold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
      display: 'Playfair-Display',
    },
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
      '5xl': 40,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
      wider: 1.2,
    },
  },

  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 12,
    },
    glow: {
      shadowColor: 'rgba(0, 245, 212, 0.5)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 8,
    },
  },

  blur: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 40,
  },

  animation: {
    duration: {
      instant: 100,
      fast: 150,
      normal: 200,
      slow: 300,
      slower: 400,
    },
    easing: {
      linear: [0.0, 0.0, 1.0, 1.0] as const,
      easeIn: [0.42, 0.0, 1.0, 1.0] as const,
      easeOut: [0.0, 0.0, 0.58, 1.0] as const,
      easeInOut: [0.42, 0.0, 0.58, 1.0] as const,
      spring: [0.2, 0.8, 0.2, 1] as const,
    },
  },

  layout: {
    container: {
      maxWidth: 1440,
      padding: 16,
    },
    grid: {
      columns: 12,
      gutter: 16,
    },
    breakpoints: {
      xs: 0,
      sm: 360,
      md: 768,
      lg: 1024,
      xl: 1440,
    },
  },

  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },

  zIndex: {
    base: 0,
    content: 10,
    sticky: 100,
    dropdown: 200,
    modal: 400,
    toast: 500,
    tooltip: 600,
  },
} as const;

export type DesignSystemType = typeof DesignSystem;
