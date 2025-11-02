import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { Typography, Spacing } from '@/constants/theme';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightElement?: React.ReactNode;
  testID?: string;
}

export function Section({ title, subtitle, children, rightElement, testID }: SectionProps) {
  const { colors } = useThemeStore();

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontFamily: Typography.family.display,
              },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  fontFamily: Typography.family.regular,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.xxl,
    lineHeight: Typography.size.xxl * Typography.lineHeight.tight,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.sm,
  },
});
