export const QuantumColors = {
  deepSpace: '#0B0F14',
  carbonNavy: '#0F1621',
  frostWhite: 'rgba(255,255,255,0.82)',
  mistWhite: 'rgba(255,255,255,0.64)',
  ionTeal: '#00F5D4',
  electricViolet: '#9B5FFF',
  iceBlue: '#00D1FF',
  success: '#19C37D',
  warning: '#FFB020',
  danger: '#FF4D4D',
};

export const QuantumGlass = {
  fill: {
    base: 'rgba(255,255,255,0.06)',
    gradient: {
      top: 'rgba(255,255,255,0.08)',
      bottom: 'rgba(255,255,255,0.04)',
    },
  },
  blur: {
    card: 28,
    background: 40,
    heavy: 32,
  },
  border: {
    inner: 'rgba(255,255,255,0.14)',
    accent: {
      start: 'rgba(0,245,212,0.25)',
      end: 'rgba(155,95,255,0.25)',
    },
  },
  shadow: {
    card: {
      color: 'rgba(0,0,0,0.55)',
      offset: { width: 0, height: 18 },
      blur: 40,
      opacity: 0.55,
    },
    cta: {
      color: 'rgba(0,210,255,0.26)',
      offset: { width: 0, height: 10 },
      blur: 26,
      opacity: 0.26,
    },
  },
};

export const QuantumRadius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 28,
  pill: 1000,
};

export const QuantumSpacing = [4, 8, 12, 16, 24, 32, 40, 56, 72];

export const QuantumTypography = {
  family: {
    heading: 'Inter-Bold',
    body: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
  },
  size: {
    h1: 38,
    h2: 24,
    body: 16,
    caption: 13,
    small: 11,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacing: {
    tight: -1,
    normal: 0,
    wide: 1.2,
  },
};

export const QuantumAnimation = {
  timing: {
    focus: 150,
    hover: 180,
    entrance: 280,
    cta: 350,
  },
  curve: [0.2, 0.8, 0.2, 1] as const,
  breathing: {
    duration: 4000,
    opacityMin: 0.18,
    opacityMax: 0.28,
  },
  parallax: {
    amount: 0.3,
  },
};

export const QuantumElevation = {
  E0: {
    shadowOpacity: 0,
  },
  E1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  E2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 40,
    elevation: 16,
  },
  E3: {
    shadowColor: QuantumColors.iceBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  E4: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const QuantumGlow = {
  focus: {
    colors: [QuantumColors.ionTeal, QuantumColors.iceBlue],
    width: 2,
  },
  crest: {
    color: 'rgba(0,245,212,0.2)',
    radius: 40,
  },
  cta: {
    color: 'rgba(0,210,255,0.3)',
    radius: 16,
  },
};
