/**
 * Accessibility Enhancement Utilities
 *
 * Standard accessibility props for common patterns
 */

import { AccessibilityProps } from 'react-native';

/**
 * Standard modal accessibility props
 */
export const getModalAccessibilityProps = (title: string, description?: string): AccessibilityProps => ({
  accessible: true,
  accessibilityViewIsModal: true,
  accessibilityLabel: description || title,
  accessibilityRole: 'none',
});

/**
 * Standard close button accessibility props
 */
export const getCloseButtonAccessibilityProps = (modalName: string = 'dialog'): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: `Close ${modalName}`,
  accessibilityHint: `Closes the ${modalName} and returns to the previous screen`,
});

/**
 * Standard submit button accessibility props
 */
export const getSubmitButtonAccessibilityProps = (
  action: string,
  disabled: boolean = false,
  loading: boolean = false
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: action,
  accessibilityHint: loading ? 'Processing your request' : `Submits the form to ${action.toLowerCase()}`,
  accessibilityState: { disabled, busy: loading },
});

/**
 * Standard cancel button accessibility props
 */
export const getCancelButtonAccessibilityProps = (): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: 'Cancel',
  accessibilityHint: 'Cancels the current action and closes this dialog',
});

/**
 * Standard form field accessibility props
 */
export const getFormFieldAccessibilityProps = (
  label: string,
  required: boolean = false,
  hint?: string
): AccessibilityProps => ({
  accessible: true,
  accessibilityLabel: label,
  accessibilityHint: hint || `Enter ${label.toLowerCase()}`,
  accessibilityRequired: required,
});

/**
 * Standard error message accessibility props
 */
export const getErrorAccessibilityProps = (errorMessage: string): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'alert',
  accessibilityLiveRegion: 'polite',
  accessibilityLabel: `Error: ${errorMessage}`,
});

/**
 * Standard warning message accessibility props
 */
export const getWarningAccessibilityProps = (warningMessage: string): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'alert',
  accessibilityLiveRegion: 'assertive',
  accessibilityLabel: `Warning: ${warningMessage}`,
});

/**
 * Standard success message accessibility props
 */
export const getSuccessAccessibilityProps = (successMessage: string): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'status',
  accessibilityLiveRegion: 'polite',
  accessibilityLabel: successMessage,
});

/**
 * Standard card/section accessibility props
 */
export const getCardAccessibilityProps = (title: string, description?: string): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'summary',
  accessibilityLabel: description ? `${title}. ${description}` : title,
});

/**
 * Standard list item accessibility props
 */
export const getListItemAccessibilityProps = (
  label: string,
  index: number,
  total: number,
  selected: boolean = false
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: `${label}. Item ${index + 1} of ${total}`,
  accessibilityState: { selected },
});

/**
 * Standard toggle/switch accessibility props
 */
export const getToggleAccessibilityProps = (
  label: string,
  checked: boolean,
  hint?: string
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'switch',
  accessibilityLabel: label,
  accessibilityHint: hint || `Toggles ${label.toLowerCase()}`,
  accessibilityState: { checked },
});

/**
 * Standard tab accessibility props
 */
export const getTabAccessibilityProps = (
  label: string,
  selected: boolean,
  index: number,
  total: number
): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'tab',
  accessibilityLabel: `${label} tab`,
  accessibilityHint: `${label} tab, ${index + 1} of ${total}`,
  accessibilityState: { selected },
});

/**
 * Standard link accessibility props
 */
export const getLinkAccessibilityProps = (label: string, destination?: string): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'link',
  accessibilityLabel: label,
  accessibilityHint: destination ? `Opens ${destination}` : 'Opens link',
});

/**
 * Standard image accessibility props
 */
export const getImageAccessibilityProps = (alt: string, decorative: boolean = false): AccessibilityProps => {
  if (decorative) {
    return {
      accessible: false,
      accessibilityElementsHidden: true,
    };
  }

  return {
    accessible: true,
    accessibilityRole: 'image',
    accessibilityLabel: alt,
  };
};

/**
 * Standard loading state accessibility props
 */
export const getLoadingAccessibilityProps = (message: string = 'Loading'): AccessibilityProps => ({
  accessible: true,
  accessibilityRole: 'progressbar',
  accessibilityLabel: message,
  accessibilityState: { busy: true },
});

/**
 * Container props (typically should not be accessible itself)
 */
export const getContainerAccessibilityProps = (): AccessibilityProps => ({
  accessible: false,
});
