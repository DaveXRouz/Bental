import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeStore } from '@/stores/useThemeStore';
import { Typography, Spacing } from '@/constants/theme';

interface ListItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  rightValue?: string;
  rightSubtitle?: string;
  showChevron?: boolean;
  onPress?: () => void;
  testID?: string;
}

export function ListItem({
  icon,
  title,
  subtitle,
  rightValue,
  rightSubtitle,
  showChevron = false,
  onPress,
  testID,
}: ListItemProps) {
  const { colors } = useThemeStore();

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      testID={testID}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderBottomColor: colors.borderLight,
        },
      ]}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontFamily: Typography.family.medium,
            },
          ]}
          numberOfLines={1}
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
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {(rightValue || rightSubtitle) && (
        <View style={styles.rightContent}>
          {rightValue && (
            <Text
              style={[
                styles.rightValue,
                {
                  color: colors.text,
                  fontFamily: Typography.family.semibold,
                },
              ]}
            >
              {rightValue}
            </Text>
          )}
          {rightSubtitle && (
            <Text
              style={[
                styles.rightSubtitle,
                {
                  color: colors.textSecondary,
                  fontFamily: Typography.family.regular,
                },
              ]}
            >
              {rightSubtitle}
            </Text>
          )}
        </View>
      )}
      {showChevron && <ChevronRight size={20} color={colors.textTertiary} />}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.md,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: Typography.size.sm,
  },
  rightContent: {
    alignItems: 'flex-end',
    marginRight: Spacing.sm,
  },
  rightValue: {
    fontSize: Typography.size.md,
    marginBottom: 2,
  },
  rightSubtitle: {
    fontSize: Typography.size.sm,
  },
});
