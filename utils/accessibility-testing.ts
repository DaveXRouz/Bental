import { ColorContrastHelpers, A11yHelpers } from './accessibility';

export interface A11yIssue {
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  type: string;
  element: string;
  description: string;
  wcagCriterion: string;
  recommendation: string;
}

export interface A11yTestResult {
  passed: boolean;
  issues: A11yIssue[];
  score: number;
  summary: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export class AccessibilityTester {
  private issues: A11yIssue[] = [];

  testColorContrast(
    foreground: string,
    background: string,
    elementType: string,
    isLargeText: boolean = false
  ): void {
    const ratio = ColorContrastHelpers.getContrastRatio(foreground, background);
    const meetsAA = ColorContrastHelpers.meetsWCAG(foreground, background, 'AA', isLargeText);
    const meetsAAA = ColorContrastHelpers.meetsWCAG(foreground, background, 'AAA', isLargeText);

    if (!meetsAA) {
      this.issues.push({
        severity: 'critical',
        type: 'color-contrast',
        element: elementType,
        description: `Insufficient color contrast ratio: ${ratio.toFixed(2)}:1`,
        wcagCriterion: 'WCAG 2.1 Level AA (1.4.3)',
        recommendation: `Increase contrast ratio to at least ${isLargeText ? '3:1' : '4.5:1'}`,
      });
    } else if (!meetsAAA) {
      this.issues.push({
        severity: 'minor',
        type: 'color-contrast',
        element: elementType,
        description: `Does not meet AAA standard: ${ratio.toFixed(2)}:1`,
        wcagCriterion: 'WCAG 2.1 Level AAA (1.4.6)',
        recommendation: `Consider increasing contrast ratio to ${isLargeText ? '4.5:1' : '7:1'} for AAA compliance`,
      });
    }
  }

  testTouchTargetSize(width: number, height: number, elementName: string): void {
    const minSize = 44;

    if (width < minSize || height < minSize) {
      this.issues.push({
        severity: 'serious',
        type: 'touch-target-size',
        element: elementName,
        description: `Touch target too small: ${width}x${height}px`,
        wcagCriterion: 'WCAG 2.1 Level AAA (2.5.5)',
        recommendation: `Increase size to at least ${minSize}x${minSize}px`,
      });
    }
  }

  testAccessibilityLabel(
    hasLabel: boolean,
    labelText: string | undefined,
    elementType: string
  ): void {
    if (!hasLabel || !labelText) {
      this.issues.push({
        severity: 'critical',
        type: 'missing-label',
        element: elementType,
        description: 'Element lacks accessibility label',
        wcagCriterion: 'WCAG 2.1 Level A (4.1.2)',
        recommendation: 'Add descriptive accessibilityLabel prop',
      });
    } else if (labelText.length < 3) {
      this.issues.push({
        severity: 'moderate',
        type: 'insufficient-label',
        element: elementType,
        description: `Label too short: "${labelText}"`,
        wcagCriterion: 'WCAG 2.1 Level A (4.1.2)',
        recommendation: 'Provide more descriptive label',
      });
    }
  }

  testKeyboardAccessibility(
    isFocusable: boolean,
    isInteractive: boolean,
    elementType: string
  ): void {
    if (isInteractive && !isFocusable) {
      this.issues.push({
        severity: 'critical',
        type: 'keyboard-inaccessible',
        element: elementType,
        description: 'Interactive element not keyboard accessible',
        wcagCriterion: 'WCAG 2.1 Level A (2.1.1)',
        recommendation: 'Make element focusable and keyboard operable',
      });
    }
  }

  testSemanticHTML(hasRole: boolean, elementType: string): void {
    if (!hasRole) {
      this.issues.push({
        severity: 'moderate',
        type: 'missing-role',
        element: elementType,
        description: 'Element lacks semantic role',
        wcagCriterion: 'WCAG 2.1 Level A (4.1.2)',
        recommendation: 'Add appropriate accessibilityRole prop',
      });
    }
  }

  testFocusIndicator(
    hasFocusIndicator: boolean,
    elementType: string
  ): void {
    if (!hasFocusIndicator) {
      this.issues.push({
        severity: 'serious',
        type: 'missing-focus-indicator',
        element: elementType,
        description: 'No visible focus indicator',
        wcagCriterion: 'WCAG 2.1 Level AA (2.4.7)',
        recommendation: 'Add visible focus state styling',
      });
    }
  }

  testImageAlternative(
    isImage: boolean,
    hasAltText: boolean,
    isDecorative: boolean,
    elementName: string
  ): void {
    if (isImage && !hasAltText && !isDecorative) {
      this.issues.push({
        severity: 'critical',
        type: 'missing-alt-text',
        element: elementName,
        description: 'Image missing alternative text',
        wcagCriterion: 'WCAG 2.1 Level A (1.1.1)',
        recommendation: 'Add accessibilityLabel or mark as decorative',
      });
    }
  }

  testFormField(
    hasLabel: boolean,
    hasError: boolean,
    errorAnnounced: boolean,
    fieldName: string
  ): void {
    if (!hasLabel) {
      this.issues.push({
        severity: 'critical',
        type: 'form-missing-label',
        element: fieldName,
        description: 'Form field without associated label',
        wcagCriterion: 'WCAG 2.1 Level A (3.3.2)',
        recommendation: 'Add visible label and accessibilityLabel',
      });
    }

    if (hasError && !errorAnnounced) {
      this.issues.push({
        severity: 'serious',
        type: 'error-not-announced',
        element: fieldName,
        description: 'Error message not announced to screen readers',
        wcagCriterion: 'WCAG 2.1 Level AA (3.3.1)',
        recommendation: 'Use accessibilityLiveRegion="polite" for error messages',
      });
    }
  }

  testAnimation(
    hasAnimation: boolean,
    respectsReduceMotion: boolean,
    elementName: string
  ): void {
    if (hasAnimation && !respectsReduceMotion) {
      this.issues.push({
        severity: 'moderate',
        type: 'motion-not-reduced',
        element: elementName,
        description: 'Animation does not respect prefers-reduced-motion',
        wcagCriterion: 'WCAG 2.1 Level AAA (2.3.3)',
        recommendation: 'Check for reduced motion preference and disable animations',
      });
    }
  }

  testTimeout(
    hasTimeout: boolean,
    timeoutDuration: number,
    isAdjustable: boolean,
    elementName: string
  ): void {
    if (hasTimeout && timeoutDuration < 20000 && !isAdjustable) {
      this.issues.push({
        severity: 'serious',
        type: 'insufficient-timeout',
        element: elementName,
        description: `Timeout too short: ${timeoutDuration}ms`,
        wcagCriterion: 'WCAG 2.1 Level A (2.2.1)',
        recommendation: 'Increase timeout to at least 20 seconds or make adjustable',
      });
    }
  }

  testHeadingHierarchy(levels: number[]): void {
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        this.issues.push({
          severity: 'moderate',
          type: 'heading-hierarchy-skip',
          element: `Heading structure`,
          description: `Heading level skipped: ${levels[i - 1]} to ${levels[i]}`,
          wcagCriterion: 'WCAG 2.1 Level A (2.4.6)',
          recommendation: 'Use sequential heading levels without skipping',
        });
      }
    }
  }

  getResults(): A11yTestResult {
    const summary = {
      critical: this.issues.filter((i) => i.severity === 'critical').length,
      serious: this.issues.filter((i) => i.severity === 'serious').length,
      moderate: this.issues.filter((i) => i.severity === 'moderate').length,
      minor: this.issues.filter((i) => i.severity === 'minor').length,
    };

    const totalIssues = this.issues.length;
    const weightedScore =
      summary.critical * 10 +
      summary.serious * 5 +
      summary.moderate * 2 +
      summary.minor * 1;

    const maxScore = 100;
    const score = Math.max(0, maxScore - weightedScore);

    return {
      passed: summary.critical === 0 && summary.serious === 0,
      issues: this.issues,
      score,
      summary,
    };
  }

  reset(): void {
    this.issues = [];
  }

  generateReport(): string {
    const result = this.getResults();

    let report = '# Accessibility Test Report\n\n';
    report += `## Score: ${result.score}/100\n\n`;
    report += `## Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    report += `## Summary\n\n`;
    report += `- Critical Issues: ${result.summary.critical}\n`;
    report += `- Serious Issues: ${result.summary.serious}\n`;
    report += `- Moderate Issues: ${result.summary.moderate}\n`;
    report += `- Minor Issues: ${result.summary.minor}\n\n`;

    if (result.issues.length > 0) {
      report += `## Issues\n\n`;

      const grouped = {
        critical: result.issues.filter((i) => i.severity === 'critical'),
        serious: result.issues.filter((i) => i.severity === 'serious'),
        moderate: result.issues.filter((i) => i.severity === 'moderate'),
        minor: result.issues.filter((i) => i.severity === 'minor'),
      };

      for (const [severity, issues] of Object.entries(grouped)) {
        if (issues.length > 0) {
          report += `### ${severity.toUpperCase()} (${issues.length})\n\n`;
          issues.forEach((issue, index) => {
            report += `${index + 1}. **${issue.type}** in ${issue.element}\n`;
            report += `   - Description: ${issue.description}\n`;
            report += `   - WCAG: ${issue.wcagCriterion}\n`;
            report += `   - Fix: ${issue.recommendation}\n\n`;
          });
        }
      }
    } else {
      report += `## ✅ No accessibility issues found!\n\n`;
    }

    return report;
  }
}

export function quickA11yCheck(component: {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
}): { passed: boolean; message: string } {
  if (component.accessible === false) {
    return {
      passed: true,
      message: 'Component correctly marked as not accessible (decorative)',
    };
  }

  if (!component.accessibilityLabel) {
    return {
      passed: false,
      message: 'Missing accessibilityLabel',
    };
  }

  if (!component.accessibilityRole) {
    return {
      passed: false,
      message: 'Missing accessibilityRole',
    };
  }

  return {
    passed: true,
    message: 'Basic accessibility requirements met',
  };
}

export const A11yTestPresets = {
  button: {
    minWidth: 44,
    minHeight: 44,
    requiredProps: ['accessibilityLabel', 'accessibilityRole'],
    recommendedProps: ['accessibilityHint'],
  },
  input: {
    requiredProps: ['accessibilityLabel'],
    recommendedProps: ['accessibilityHint', 'accessibilityValue'],
  },
  image: {
    requiredProps: ['accessibilityLabel'],
    alternativeProps: ['accessible: false'],
  },
  link: {
    requiredProps: ['accessibilityLabel', 'accessibilityRole'],
    recommendedProps: ['accessibilityHint'],
  },
};
