import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform, ScrollView } from 'react-native';
import { useAccessibilityPreferences, announceForAccessibility } from '@/utils/progressive-enhancement';

interface SkipLinkProps {
  targetRef: React.RefObject<ScrollView | View>;
  label?: string;
  children?: React.ReactNode;
}

export function SkipLink({
  targetRef,
  label = 'Skip to main content',
  children,
}: SkipLinkProps) {
  const preferences = useAccessibilityPreferences();
  const [isFocused, setIsFocused] = React.useState(false);

  const handlePress = () => {
    if (targetRef.current) {
      if ('scrollTo' in targetRef.current) {
        targetRef.current.scrollTo({ y: 0, animated: !preferences.reduceMotion });
      }

      announceForAccessibility('Skipped to main content');
    }
  };

  if (Platform.OS !== 'web' && !preferences.screenReaderEnabled) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.skipLink, isFocused && styles.skipLinkFocused]}
      onPress={handlePress}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      accessible={true}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Text style={styles.skipLinkText}>{children || label}</Text>
    </TouchableOpacity>
  );
}

interface SkipNavigationProps {
  sections: Array<{
    label: string;
    ref: React.RefObject<any>;
  }>;
}

export function SkipNavigation({ sections }: SkipNavigationProps) {
  const preferences = useAccessibilityPreferences();

  if (!preferences.screenReaderEnabled && Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.skipNav} accessible={false}>
      <Text style={styles.skipNavTitle}>Skip to:</Text>
      {sections.map((section, index) => (
        <SkipLink key={index} targetRef={section.ref} label={section.label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skipLink: {
    position: 'absolute',
    top: -100,
    left: 0,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    padding: 12,
    zIndex: 9999,
    borderRadius: 4,
    margin: 8,
  },
  skipLinkFocused: {
    top: 0,
  },
  skipLinkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  skipNavTitle: {
    position: 'absolute',
    left: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});
