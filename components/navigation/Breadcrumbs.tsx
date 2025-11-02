import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, usePathname, useSegments } from 'expo-router';
import { ChevronRight, Home } from 'lucide-react-native';
import { colors, spacing } from '@/constants/theme';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Home',
  'index': 'Dashboard',
  'portfolio': 'Portfolio',
  'markets': 'Markets',
  'history': 'Activity',
  'ai-assistant': 'AI Trading',
  'trade': 'Trade',
  'profile': 'Profile',
  'support': 'Support',
  'more': 'More',
  'stock': 'Stock Details',
};

export function Breadcrumbs() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  const breadcrumbs: BreadcrumbItem[] = [];

  breadcrumbs.push({ label: 'Home', path: '/(tabs)/' });

  if (segments.length > 0) {
    let currentPath = '';

    segments.forEach((segment, index) => {
      if (segment === '(tabs)' || segment === '(auth)') return;

      currentPath += `/${segment}`;

      const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      if (segment.startsWith('[') && segment.endsWith(']')) {
        const paramValue = pathname.split('/').pop() || segment;
        breadcrumbs.push({
          label: paramValue.toUpperCase(),
          path: currentPath,
        });
      } else {
        breadcrumbs.push({
          label,
          path: `/(tabs)${currentPath}`,
        });
      }
    });
  }

  if (breadcrumbs.length <= 1) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;

          return (
            <View key={crumb.path} style={styles.breadcrumbItem}>
              <TouchableOpacity
                onPress={() => !isLast && router.push(crumb.path as any)}
                disabled={isLast}
                style={styles.breadcrumbButton}
                activeOpacity={0.7}
              >
                {isFirst && (
                  <Home
                    size={14}
                    color={isLast ? colors.text : colors.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.breadcrumbText,
                    isLast && styles.breadcrumbTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {crumb.label}
                </Text>
              </TouchableOpacity>

              {!isLast && (
                <ChevronRight
                  size={14}
                  color={colors.textMuted}
                  style={styles.separator}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  breadcrumbTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: spacing.xs,
  },
});
