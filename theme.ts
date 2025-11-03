export const theme = {
  colors: {
    background: '#0B0D10',
    surface: 'rgba(255, 255, 255, 0.06)',
    surfaceHover: 'rgba(255, 255, 255, 0.08)',
    stroke: 'rgba(255, 255, 255, 0.12)',
    strokeFocus: '#22D3EE',
    accent: '#22D3EE',
    accentSecondary: '#3B82F6',
    text: '#E6EAF2',
    textSecondary: '#8B93A5',
    placeholder: '#8B93A5',
    error: '#EF4444',
    success: '#10B981',
    white: '#FFFFFF',
  },
  spacing: (multiplier: number) => multiplier * 8,
  radii: {
    sm: 8,
    md: 14,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    glow: {
      shadowColor: '#22D3EE',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  typography: {
    h4: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
  },
};

export const ACCENT_GRADIENT = ['#22D3EE', '#3B82F6'];
