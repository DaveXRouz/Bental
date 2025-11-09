// Quantum Glass Design System Constants
// Used for advanced glassmorphism effects in quantum components

export const QUANTUM_GLASS = {
  // Background colors with varying opacity
  backgrounds: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    heavy: 'rgba(255, 255, 255, 0.18)',
    ultraLight: 'rgba(255, 255, 255, 0.05)',
  },

  // Border colors
  borders: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.15)',
    heavy: 'rgba(255, 255, 255, 0.25)',
    glow: 'rgba(200, 200, 200, 0.4)',
  },

  // Shadow effects
  shadows: {
    soft: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    hard: 'rgba(0, 0, 0, 0.7)',
  },

  // Blur intensities
  blur: {
    light: 12,
    medium: 20,
    heavy: 40,
    ultra: 60,
  },

  // Gradient colors for plasma effects
  gradients: {
    plasma: [
      'rgba(59, 130, 246, 0.3)',
      'rgba(139, 92, 246, 0.3)',
      'rgba(236, 72, 153, 0.3)',
    ],
    quantum: [
      'rgba(16, 185, 129, 0.2)',
      'rgba(59, 130, 246, 0.2)',
      'rgba(139, 92, 246, 0.2)',
    ],
    shield: [
      'rgba(255, 255, 255, 0.1)',
      'rgba(200, 200, 200, 0.05)',
    ],
  },

  // Animation durations
  animation: {
    fast: 150,
    normal: 300,
    slow: 600,
    ultraSlow: 1200,
  },
};

export const PLASMA_COLORS = [
  'rgba(59, 130, 246, 0.4)',
  'rgba(139, 92, 246, 0.4)',
  'rgba(236, 72, 153, 0.4)',
  'rgba(16, 185, 129, 0.4)',
];

export const QUANTUM_EFFECTS = {
  glow: {
    shadowColor: 'rgba(200, 200, 200, 0.6)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  subtle: {
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Additional exports for component compatibility
export const QuantumColors = PLASMA_COLORS;
export const QuantumAnimation = {
  ...QUANTUM_GLASS.animation,
  curve: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  timing: {
    cta: 600,
    hover: 200,
    press: 100,
  },
};
export const QuantumTypography = {
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
export const QuantumRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
export const QuantumElevation = QUANTUM_EFFECTS;

export default QUANTUM_GLASS;
