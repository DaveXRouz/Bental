import { Platform } from 'react-native';

export const globalFocusStylesCSS = `
  /* ===================================
     Global Keyboard Focus Styles
     WCAG 2.1 Level AA Compliant
     =================================== */

  /* Remove default outlines (we'll add custom ones) */
  *:focus {
    outline: none;
  }

  /* Custom focus-visible for keyboard navigation only */
  *:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Buttons and clickable elements */
  button:focus-visible,
  [role="button"]:focus-visible,
  [type="button"]:focus-visible,
  [type="submit"]:focus-visible,
  [type="reset"]:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  }

  /* Form inputs */
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 0;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Links */
  a:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
    text-decoration: underline;
    text-decoration-thickness: 2px;
  }

  /* Cards and pressable containers */
  [role="article"]:focus-visible,
  [role="listitem"]:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }

  /* Skip navigation links */
  .skip-link {
    position: absolute;
    left: -9999px;
    top: 0;
    z-index: 9999;
    padding: 16px 24px;
    background-color: #000;
    color: #fff;
    text-decoration: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 16px;
  }

  .skip-link:focus {
    left: 50%;
    transform: translateX(-50%);
    top: 8px;
  }

  /* Modals - ensure high visibility */
  [role="dialog"]:focus-visible {
    outline: 3px solid #3B82F6;
    outline-offset: -3px;
  }

  /* Disabled elements - no focus */
  *:disabled,
  [aria-disabled="true"] {
    cursor: not-allowed;
    opacity: 0.6;
  }

  *:disabled:focus,
  [aria-disabled="true"]:focus {
    outline: none;
    box-shadow: none;
  }

  /* Dark mode focus styles */
  @media (prefers-color-scheme: dark) {
    *:focus-visible {
      outline-color: #60A5FA;
    }

    button:focus-visible,
    [role="button"]:focus-visible {
      outline-color: #60A5FA;
      box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2);
    }

    input:focus-visible,
    textarea:focus-visible,
    select:focus-visible {
      outline-color: #60A5FA;
      border-color: #60A5FA;
      box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15);
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    *:focus-visible {
      outline-width: 3px;
      outline-offset: 3px;
    }
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    *:focus-visible {
      transition: none !important;
      animation: none !important;
    }
  }

  /* Focus within - for containers with focused children */
  .focus-within:focus-within {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }

  /* Custom focus ring utilities */
  .focus-ring-inset:focus-visible {
    outline-offset: -2px;
  }

  .focus-ring-thick:focus-visible {
    outline-width: 3px;
  }

  .focus-ring-offset-4:focus-visible {
    outline-offset: 4px;
  }

  /* Remove focus ring for mouse users (optional) */
  .no-focus-visible:focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }
`;

export function injectGlobalFocusStyles() {
  if (Platform.OS !== 'web') return;

  if (typeof document === 'undefined') return;

  // Check if styles already injected
  if (document.getElementById('global-focus-styles')) return;

  const style = document.createElement('style');
  style.id = 'global-focus-styles';
  style.textContent = globalFocusStylesCSS;
  document.head.appendChild(style);
}

// React Native focus style utilities
export const focusStyles = {
  default: Platform.select({
    web: {
      outlineWidth: 2,
      outlineStyle: 'solid' as const,
      outlineColor: '#3B82F6',
      outlineOffset: 2,
    },
    default: {},
  }),

  inset: Platform.select({
    web: {
      outlineWidth: 2,
      outlineStyle: 'solid' as const,
      outlineColor: '#3B82F6',
      outlineOffset: -2,
    },
    default: {},
  }),

  thick: Platform.select({
    web: {
      outlineWidth: 3,
      outlineStyle: 'solid' as const,
      outlineColor: '#3B82F6',
      outlineOffset: 2,
    },
    default: {},
  }),

  dark: Platform.select({
    web: {
      outlineWidth: 2,
      outlineStyle: 'solid' as const,
      outlineColor: '#60A5FA',
      outlineOffset: 2,
    },
    default: {},
  }),
};
