# Dashboard Quick Reference Guide

Quick reference for developers working with the enhanced dashboard implementation.

---

## 🚀 Quick Start

### Understanding the Dashboard Flow

1. **Initial Load** → Shows skeleton screens
2. **Data Fetch** → Updates state from Supabase
3. **Content Display** → Smooth transition from skeletons
4. **User Actions** → Haptic feedback + visual changes
5. **Refresh** → Pull-down with branded indicator
6. **Errors** → User-friendly message + retry option

---

## 📦 Key Components

### Main Dashboard
```typescript
// Location: app/(tabs)/index.tsx
// Purpose: Main dashboard container with all sections
// Key Features: Loading skeletons, refresh control, error handling
```

### GlassSkeleton
```typescript
// Location: components/glass/GlassSkeleton.tsx
// Usage: <GlassSkeleton width={120} height={20} borderRadius={10} />
// Purpose: Animated loading placeholder
```

### ConnectionStatusBanner
```typescript
// Location: components/ui/ConnectionStatusBanner.tsx
// Usage: <ConnectionStatusBanner />
// Purpose: Shows offline status automatically
```

### RecentActivity
```typescript
// Location: components/dashboard/RecentActivity.tsx
// Features: Error handling, retry button, navigation to history
```

---

## 🎨 Design Tokens

### Colors
```typescript
const colors = {
  background: '#000000',
  glass: 'rgba(26, 26, 28, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  white: '#FFFFFF',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
};
```

### Spacing
```typescript
const S = 8; // Base unit

// Usage examples:
marginBottom: S * 2     // 16px
padding: S * 3          // 24px
gap: S * 1.5            // 12px
```

### Typography
```typescript
fontSize: {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
}

fontWeight: {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

---

## 🔧 Common Patterns

### Loading State Pattern
```typescript
const [loading, setLoading] = useState(true);

if (loading) {
  return (
    <View>
      <GlassSkeleton width="100%" height={20} />
      <GlassSkeleton width="80%" height={20} />
    </View>
  );
}
```

### Error State Pattern
```typescript
const [error, setError] = useState<string | null>(null);

if (error) {
  return (
    <View>
      <Text>{error}</Text>
      <TouchableOpacity onPress={retry}>
        <Text>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Haptic Feedback Pattern
```typescript
import * as Haptics from 'expo-haptics';

const handlePress = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  // ... rest of logic
};
```

### Timestamp Formatting
```typescript
const formatTimeSince = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) return 'just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return 'today';
};
```

---

## 📱 Responsive Utilities

### Breakpoints
```typescript
import { useWindowDimensions } from 'react-native';
import { breakpoints } from '@/constants/theme';

const { width } = useWindowDimensions();
const isTablet = width >= breakpoints.tablet; // 768px
const isMobile = width < breakpoints.tablet;
```

### Conditional Sizing
```typescript
fontSize: isTablet ? 24 : 20
padding: isMobile ? S * 2 : S * 4
```

---

## ♿ Accessibility Quick Reference

### Touch Targets
```typescript
// Minimum 44px for all interactive elements
minHeight: 44
minWidth: 44

// For small icons, add hitSlop
hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
```

### Labels
```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Descriptive action"
  accessibilityHint="What happens when pressed"
  accessibilityState={{ selected: true }}
>
  <Text>Button</Text>
</TouchableOpacity>
```

### Dynamic Content
```typescript
<View
  accessibilityRole="alert"
  accessibilityLiveRegion="polite"
>
  <Text>{dynamicMessage}</Text>
</View>
```

---

## 🎭 Animation Recipes

### Fade In/Out
```typescript
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

<Animated.View
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(200)}
>
  <Content />
</Animated.View>
```

### Slide Down/Up
```typescript
import { FadeInDown, FadeOutUp } from 'react-native-reanimated';

<Animated.View
  entering={FadeInDown.duration(300)}
  exiting={FadeOutUp.duration(200)}
>
  <Banner />
</Animated.View>
```

### Shimmer Effect
```typescript
const shimmer = useSharedValue(0);

useEffect(() => {
  shimmer.value = withRepeat(
    withTiming(1, { duration: 1500, easing: Easing.ease }),
    -1,
    false
  );
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: 0.3 + shimmer.value * 0.4,
}));
```

---

## 🔄 Data Fetching Pattern

### Standard Fetch
```typescript
const fetchData = useCallback(async () => {
  if (!userId) return;

  try {
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      setError('Failed to load data');
      return;
    }

    setData(data);
  } catch (error) {
    console.error('[Component] Error:', error);
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
}, [userId]);
```

### With Refresh
```typescript
const onRefresh = useCallback(() => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  setRefreshing(true);
  fetchData().then(() => setRefreshing(false));
}, [fetchData]);
```

---

## 🎯 Common Tasks

### Adding a New Skeleton
1. Identify component size and shape
2. Add `<GlassSkeleton>` with appropriate dimensions
3. Match border radius to final component
4. Position in same location as real content

### Adding Error Handling
1. Add `error` state: `const [error, setError] = useState<string | null>(null)`
2. Set error in catch block: `setError('User-friendly message')`
3. Clear error before new attempt: `setError(null)`
4. Display error with retry button

### Adding Haptic Feedback
1. Import: `import * as Haptics from 'expo-haptics'`
2. Add to event handler with platform check
3. Choose appropriate style: Light, Medium, Heavy
4. Test on physical device

### Making Component Accessible
1. Add `accessibilityRole`
2. Add `accessibilityLabel`
3. Add `accessibilityHint` for context
4. Ensure 44px minimum touch target
5. Test with screen reader

---

## 🐛 Common Issues & Solutions

### Issue: Skeleton doesn't match content
**Solution**: Measure final component and use exact dimensions

### Issue: Haptics not working
**Solution**: Check Platform.OS !== 'web' and test on physical device

### Issue: Connection banner not showing
**Solution**: Web only feature, check browser console for errors

### Issue: Last updated not updating
**Solution**: Ensure setLastUpdated(new Date()) is called after fetch

### Issue: Animations janky
**Solution**: Check for expensive operations in render, use useMemo/useCallback

### Issue: Text not readable
**Solution**: Verify color contrast, check opacity values

---

## 📊 Performance Tips

1. **Memoize expensive calculations**: Use `useMemo` for complex data transformations
2. **Callback stability**: Use `useCallback` for event handlers
3. **Proper dependencies**: Always specify complete dependency arrays
4. **Avoid inline styles**: Use `StyleSheet.create` or memoized styles
5. **Lazy load images**: Use progressive loading for large images
6. **Debounce inputs**: Add 300ms delay for search/filter inputs

---

## 🔍 Debugging Tips

### Console Logging
```typescript
console.log('[Component] Action:', data);
console.warn('[Component] Warning:', warning);
console.error('[Component] Error:', error);
```

### React DevTools
- Check component re-renders
- Inspect props and state
- Profile performance

### Network Tab
- Verify API calls
- Check response times
- Monitor payload sizes

---

## 📚 Further Reading

- **Glassmorphism Guide**: See login page (`app/(auth)/login.tsx`) as reference
- **Design System**: `constants/theme.ts` and `constants/glass.ts`
- **Accessibility**: `docs/ACCESSIBILITY-QUICK-REFERENCE.md`
- **Animation Patterns**: `docs/RESPONSIVE-ANIMATION-STRATEGY.md`

---

## 🆘 Getting Help

1. Check this quick reference first
2. Review complete summary: `DASHBOARD-COMPLETE-SUMMARY.md`
3. Check component documentation in file headers
4. Review accessibility guide for WCAG compliance
5. Test on multiple devices/browsers

---

**Last Updated**: Dashboard Enhancements Phase 2
**Status**: Production Ready
**Maintained By**: Development Team
