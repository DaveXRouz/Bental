import { Platform, AccessibilityInfo } from 'react-native';
import { useState, useEffect } from 'react';

export interface AccessibilityPreferences {
  reduceMotion: boolean;
  screenReaderEnabled: boolean;
  boldText: boolean;
  grayscale: boolean;
  invertColors: boolean;
}

export async function getAccessibilityPreferences(): Promise<AccessibilityPreferences> {
  const [
    reduceMotion,
    screenReaderEnabled,
    boldText,
    grayscale,
    invertColors,
  ] = await Promise.all([
    AccessibilityInfo.isReduceMotionEnabled(),
    AccessibilityInfo.isScreenReaderEnabled(),
    AccessibilityInfo.isBoldTextEnabled(),
    AccessibilityInfo.isGrayscaleEnabled(),
    AccessibilityInfo.isInvertColorsEnabled(),
  ]);

  return {
    reduceMotion: reduceMotion || false,
    screenReaderEnabled: screenReaderEnabled || false,
    boldText: boldText || false,
    grayscale: grayscale || false,
    invertColors: invertColors || false,
  };
}

export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reduceMotion: false,
    screenReaderEnabled: false,
    boldText: false,
    grayscale: false,
    invertColors: false,
  });

  useEffect(() => {
    let mounted = true;

    getAccessibilityPreferences().then((prefs) => {
      if (mounted) {
        setPreferences(prefs);
      }
    });

    const listeners = [
      AccessibilityInfo.addEventListener('reduceMotionChanged', (reduceMotion) => {
        if (mounted) {
          setPreferences((prev) => ({ ...prev, reduceMotion }));
        }
      }),
      AccessibilityInfo.addEventListener('screenReaderChanged', (screenReaderEnabled) => {
        if (mounted) {
          setPreferences((prev) => ({ ...prev, screenReaderEnabled }));
        }
      }),
      AccessibilityInfo.addEventListener('boldTextChanged', (boldText) => {
        if (mounted) {
          setPreferences((prev) => ({ ...prev, boldText }));
        }
      }),
      AccessibilityInfo.addEventListener('grayscaleChanged', (grayscale) => {
        if (mounted) {
          setPreferences((prev) => ({ ...prev, grayscale }));
        }
      }),
      AccessibilityInfo.addEventListener('invertColorsChanged', (invertColors) => {
        if (mounted) {
          setPreferences((prev) => ({ ...prev, invertColors }));
        }
      }),
    ];

    return () => {
      mounted = false;
      listeners.forEach((listener) => listener.remove());
    };
  }, []);

  return preferences;
}

export function getResponsiveFontSize(baseSize: number, boldText: boolean): number {
  return boldText ? baseSize * 1.15 : baseSize;
}

export function getAnimationDuration(baseDuration: number, reduceMotion: boolean): number {
  return reduceMotion ? 0 : baseDuration;
}

export function getAnimationConfig(reduceMotion: boolean) {
  return {
    duration: reduceMotion ? 0 : 300,
    useNativeDriver: Platform.OS !== 'web',
    reduceMotion,
  };
}

export function shouldAutoPlay(reduceMotion: boolean, userPreference?: boolean): boolean {
  if (reduceMotion) return false;
  if (userPreference !== undefined) return userPreference;
  return true;
}

export function getContrastRatio(luminance1: number, luminance2: number): number {
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function meetsWCAGStandard(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  largeText = false
): { passes: boolean; ratio: number } {
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    return { passes: false, ratio: 0 };
  }

  const fgLuminance = getLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  const ratio = getContrastRatio(fgLuminance, bgLuminance);

  const threshold = level === 'AAA' ? (largeText ? 4.5 : 7) : largeText ? 3 : 4.5;

  return {
    passes: ratio >= threshold,
    ratio,
  };
}

export const FocusIndicator = {
  web: {
    outline: '2px solid #3B82F6',
    outlineOffset: 2,
  },
  native: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
};

export function getTouchTargetSize(minSize = 44): { width: number; height: number } {
  return { width: minSize, height: minSize };
}

export function announceForAccessibility(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (Platform.OS === 'web') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  } else {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

export const ProgressiveEnhancement = {
  supportsHaptics: () => Platform.OS !== 'web',
  supportsBlur: () => true,
  supportsAnimations: () => true,
  supportsGestures: () => Platform.OS !== 'web',
  supportsNativeDriver: () => Platform.OS !== 'web',
};

export function getKeyboardType(inputType: 'email' | 'phone' | 'number' | 'url' | 'default') {
  const keyboardMap = {
    email: 'email-address',
    phone: 'phone-pad',
    number: 'numeric',
    url: 'url',
    default: 'default',
  } as const;

  return keyboardMap[inputType];
}

export function getAutoCompleteType(fieldType: string) {
  const autoCompleteMap: Record<string, string> = {
    email: 'email',
    password: 'password',
    username: 'username',
    name: 'name',
    'given-name': 'given-name',
    'family-name': 'family-name',
    'street-address': 'street-address',
    'postal-code': 'postal-code',
    tel: 'tel',
    cc: 'cc-number',
    'cc-exp': 'cc-exp',
    'cc-csc': 'cc-csc',
  };

  return autoCompleteMap[fieldType] || 'off';
}

export const InclusiveSpacing = {
  minimum: {
    touchTarget: 44,
    textSize: 16,
    lineHeight: 1.5,
    paragraphSpacing: 16,
  },
  comfortable: {
    touchTarget: 48,
    textSize: 18,
    lineHeight: 1.6,
    paragraphSpacing: 20,
  },
};

export function enhanceForAccessibility<T extends Record<string, any>>(
  component: T,
  preferences: AccessibilityPreferences
): T {
  return {
    ...component,
    reduceMotion: preferences.reduceMotion,
    increasedContrast: preferences.invertColors,
    scaledText: preferences.boldText,
    optimizedForScreenReader: preferences.screenReaderEnabled,
  };
}
