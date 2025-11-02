import { AccessibilityInfo, Platform } from 'react-native';

export interface A11yProps {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  accessibilityActions?: Array<{ name: string; label?: string }>;
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive';
}

export const A11yHelpers = {
  announce(message: string, assertive: boolean = false) {
    if (Platform.OS === 'web') {
      const region = document.createElement('div');
      region.setAttribute('role', assertive ? 'alert' : 'status');
      region.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
      region.setAttribute('aria-atomic', 'true');
      region.style.position = 'absolute';
      region.style.left = '-10000px';
      region.style.width = '1px';
      region.style.height = '1px';
      region.style.overflow = 'hidden';
      region.textContent = message;

      document.body.appendChild(region);

      setTimeout(() => {
        document.body.removeChild(region);
      }, 1000);
    } else {
      AccessibilityInfo.announceForAccessibility(message);
    }
  },

  async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.error('Error checking screen reader status:', error);
      return false;
    }
  },

  async isReduceMotionEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.error('Error checking reduce motion status:', error);
      return false;
    }
  },

  async getRecommendedTimeout(defaultTimeout: number): Promise<number> {
    try {
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      return isScreenReaderEnabled ? defaultTimeout * 2 : defaultTimeout;
    } catch (error) {
      return defaultTimeout;
    }
  },

  button(label: string, hint?: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: 'button',
    };
  },

  heading(level: 1 | 2 | 3 | 4 | 5 | 6, label: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'header',
      accessibilityValue: { text: `Heading level ${level}` },
    };
  },

  link(label: string, hint?: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: 'link',
    };
  },

  checkbox(label: string, checked: boolean, hint?: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: 'checkbox',
      accessibilityState: { checked },
    };
  },

  radioButton(label: string, selected: boolean, hint?: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityHint: hint,
      accessibilityRole: 'radio',
      accessibilityState: { selected },
    };
  },

  slider(label: string, value: number, min: number, max: number): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'adjustable',
      accessibilityValue: { min, max, now: value },
    };
  },

  progressBar(label: string, value: number, min: number = 0, max: number = 100): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'progressbar',
      accessibilityValue: { min, max, now: value, text: `${value} percent` },
    };
  },

  image(description: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: description,
      accessibilityRole: 'image',
    };
  },

  decorative(): A11yProps {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no',
    };
  },

  region(label: string): A11yProps {
    return {
      accessible: true,
      accessibilityLabel: label,
      accessibilityRole: 'none',
    };
  },

  liveRegion(assertive: boolean = false): A11yProps {
    return {
      accessibilityLiveRegion: assertive ? 'assertive' : 'polite',
    };
  },
};

export const ColorContrastHelpers = {
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  },

  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA', large: boolean = false): boolean {
    const ratio = this.getContrastRatio(color1, color2);

    if (level === 'AAA') {
      return large ? ratio >= 4.5 : ratio >= 7;
    }

    return large ? ratio >= 3 : ratio >= 4.5;
  },
};

export const FocusManagement = {
  focusableElements: new Set<string>(),

  registerFocusable(id: string) {
    this.focusableElements.add(id);
  },

  unregisterFocusable(id: string) {
    this.focusableElements.delete(id);
  },

  isFocusable(id: string): boolean {
    return this.focusableElements.has(id);
  },
};

export const ProgressiveEnhancement = {
  features: {
    animations: true,
    haptics: true,
    gestures: true,
    advancedGraphics: true,
  },

  async detectCapabilities() {
    try {
      const reduceMotion = await A11yHelpers.isReduceMotionEnabled();
      this.features.animations = !reduceMotion;
      this.features.haptics = Platform.OS !== 'web';
      this.features.gestures = Platform.OS !== 'web';
      this.features.advancedGraphics = Platform.OS !== 'web';
    } catch (error) {
      console.error('Error detecting capabilities:', error);
    }
  },

  shouldUseAnimation(): boolean {
    return this.features.animations;
  },

  shouldUseHaptics(): boolean {
    return this.features.haptics;
  },

  shouldUseGestures(): boolean {
    return this.features.gestures;
  },

  shouldUseAdvancedGraphics(): boolean {
    return this.features.advancedGraphics;
  },
};

export const KeyboardNavigation = {
  isKeyboardEvent(event: any): boolean {
    return event && (event.key || event.keyCode);
  },

  isEnterOrSpace(event: any): boolean {
    return (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.keyCode === 13 ||
      event.keyCode === 32
    );
  },

  isEscape(event: any): boolean {
    return event.key === 'Escape' || event.keyCode === 27;
  },

  isArrowKey(event: any): boolean {
    return (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key) ||
      [37, 38, 39, 40].includes(event.keyCode)
    );
  },

  getArrowDirection(event: any): 'up' | 'down' | 'left' | 'right' | null {
    if (event.key === 'ArrowUp' || event.keyCode === 38) return 'up';
    if (event.key === 'ArrowDown' || event.keyCode === 40) return 'down';
    if (event.key === 'ArrowLeft' || event.keyCode === 37) return 'left';
    if (event.key === 'ArrowRight' || event.keyCode === 39) return 'right';
    return null;
  },
};

export interface TextAlternative {
  short: string;
  medium: string;
  long: string;
  aria: string;
}

export function createTextAlternatives(
  base: string,
  context?: string
): TextAlternative {
  return {
    short: base,
    medium: context ? `${base}: ${context}` : base,
    long: context ? `${base}. ${context}` : base,
    aria: context ? `${base}, ${context}` : base,
  };
}

export function formatCurrencyForScreenReader(amount: number, currency: string = 'USD'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);

  return formatted.replace(/[$,]/g, ' ').trim() + ' ' + currency;
}

export function formatPercentForScreenReader(value: number): string {
  return `${value > 0 ? 'plus' : 'minus'} ${Math.abs(value).toFixed(2)} percent`;
}

export function formatDateForScreenReader(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
