import { Platform, View, Pressable, Text, StyleSheet } from 'react-native';

interface SkipLink {
  id: string;
  label: string;
}

interface SkipNavigationProps {
  links?: SkipLink[];
}

const DEFAULT_LINKS: SkipLink[] = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'navigation', label: 'Skip to navigation' },
];

export function SkipNavigation({ links = DEFAULT_LINKS }: SkipNavigationProps) {
  if (Platform.OS !== 'web') return null;

  const handleSkip = (targetId: string) => {
    if (typeof document === 'undefined') return;

    const element = document.getElementById(targetId);
    if (element) {
      // Set tabindex to make element focusable
      element.setAttribute('tabindex', '-1');
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabindex after focus
      element.addEventListener(
        'blur',
        () => element.removeAttribute('tabindex'),
        { once: true }
      );
    }
  };

  return (
    <View style={styles.container} aria-label="Skip navigation links">
      {links.map((link) => (
        <Pressable
          key={link.id}
          onPress={() => handleSkip(link.id)}
          style={styles.skipLink}
          accessibilityRole="link"
          accessibilityLabel={link.label}
          {...(Platform.OS === 'web' && {
            tabIndex: 0,
            onKeyDown: (e: any) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSkip(link.id);
              }
            },
          })}
        >
          <Text style={styles.skipText}>{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -9999,
    top: 0,
    zIndex: 9999,
  },
  skipLink: {
    backgroundColor: '#000',
    padding: 16,
    margin: 4,
    borderRadius: 4,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Export CSS to be added to global styles
export const skipNavigationCSS = `
.skip-navigation a:focus,
.skip-navigation button:focus {
  position: fixed !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  top: 8px !important;
  z-index: 9999 !important;
}
`;
