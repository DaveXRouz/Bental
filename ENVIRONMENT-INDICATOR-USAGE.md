# Environment Indicator Component

## Overview

The `EnvironmentIndicator` component displays the current environment (DEVELOPMENT, STAGING, PRODUCTION, LOCAL) based on the Supabase URL configured in your environment variables.

---

## Features

- Automatically detects environment from Supabase URL
- Two variants: badge and banner
- Color-coded for easy identification:
  - **PRODUCTION**: Green (`#10B981`)
  - **STAGING**: Orange (`#F59E0B`)
  - **DEVELOPMENT**: Blue (`#3B82F6`)
  - **LOCAL**: Purple (`#8B5CF6`)
- Hidden in production by default (can be overridden)
- Responsive and accessible

---

## Installation

The component is already installed and exported from `@/components/ui`.

---

## Basic Usage

### Badge Variant (Default)

```tsx
import { EnvironmentIndicator } from '@/components/ui';

function MyScreen() {
  return (
    <View>
      <EnvironmentIndicator />
      {/* Your screen content */}
    </View>
  );
}
```

### Banner Variant

```tsx
import { EnvironmentIndicator } from '@/components/ui';

function MyScreen() {
  return (
    <View>
      <EnvironmentIndicator variant="banner" />
      {/* Your screen content */}
    </View>
  );
}
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'badge' \| 'banner'` | `'badge'` | Display style of the indicator |
| `showInProduction` | `boolean` | `false` | Whether to show in production environment |

---

## Examples

### 1. Header Badge

Add to your app header to always show the environment:

```tsx
import { View, Text } from 'react-native';
import { EnvironmentIndicator } from '@/components/ui';

export function AppHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
      <Text style={{ flex: 1, fontSize: 20, fontWeight: 'bold' }}>
        My Trading App
      </Text>
      <EnvironmentIndicator />
    </View>
  );
}
```

### 2. Dashboard Banner

Add at the top of your dashboard:

```tsx
import { View, ScrollView } from 'react-native';
import { EnvironmentIndicator } from '@/components/ui';

export default function Dashboard() {
  return (
    <ScrollView>
      <EnvironmentIndicator variant="banner" />
      {/* Dashboard content */}
    </ScrollView>
  );
}
```

### 3. Settings Screen with Production Override

Show in all environments, including production:

```tsx
import { View, Text } from 'react-native';
import { EnvironmentIndicator } from '@/components/ui';

export default function Settings() {
  return (
    <View>
      <Text>Environment Configuration</Text>
      <EnvironmentIndicator showInProduction={true} />
      {/* Settings content */}
    </View>
  );
}
```

### 4. Inline in Text

Use with custom styling:

```tsx
import { View, Text } from 'react-native';
import { getEnvironmentFromUrl } from '@/config/env';

export function EnvironmentInfo() {
  const env = getEnvironmentFromUrl();

  return (
    <View>
      <Text>
        Connected to:{' '}
        <Text style={{ 
          color: env === 'STAGING' ? '#F59E0B' : '#10B981',
          fontWeight: 'bold'
        }}>
          {env}
        </Text>
      </Text>
    </View>
  );
}
```

### 5. Admin Panel

Add to admin screens to clearly show non-production environments:

```tsx
import { View } from 'react-native';
import { EnvironmentIndicator } from '@/components/ui';

export default function AdminPanel() {
  return (
    <View>
      <EnvironmentIndicator variant="banner" />
      <Text>Admin Panel</Text>
      {/* Admin content */}
    </View>
  );
}
```

---

## Environment Detection

The component uses the `getEnvironmentFromUrl()` function from `@/config/env` to determine the environment based on the Supabase URL:

```typescript
import { getEnvironmentFromUrl } from '@/config/env';

const environment = getEnvironmentFromUrl();
// Returns: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION' | 'LOCAL'
```

### URL Mapping

- `tnjgqdpxvkciiqdrdkyz` → STAGING
- `urkokrimzciotxhykics` → PRODUCTION
- `oanohrjkniduqkkahmel` → DEVELOPMENT
- No URL or unrecognized → LOCAL

---

## Customization

### Custom Colors

Create your own variant:

```tsx
import { View, Text } from 'react-native';
import { getEnvironmentFromUrl } from '@/config/env';

function CustomEnvironmentBadge() {
  const env = getEnvironmentFromUrl();

  const getColor = () => {
    switch (env) {
      case 'PRODUCTION': return '#00FF00'; // Bright green
      case 'STAGING': return '#FFA500'; // Orange
      default: return '#808080'; // Gray
    }
  };

  return (
    <View style={{
      backgroundColor: getColor(),
      padding: 8,
      borderRadius: 4,
    }}>
      <Text style={{ color: '#000', fontWeight: 'bold' }}>
        {env}
      </Text>
    </View>
  );
}
```

### Conditional Rendering

Show only in non-production:

```tsx
import { getEnvironmentFromUrl } from '@/config/env';
import { EnvironmentIndicator } from '@/components/ui';

function MyComponent() {
  const env = getEnvironmentFromUrl();

  return (
    <View>
      {env !== 'PRODUCTION' && <EnvironmentIndicator />}
      {/* Content */}
    </View>
  );
}
```

---

## Best Practices

1. **Production Visibility**: Keep `showInProduction={false}` (default) to avoid confusing users
2. **Placement**: Add to app header or top of main screens for developer visibility
3. **Admin Screens**: Always show on admin/debug screens with `showInProduction={true}`
4. **Testing**: Use banner variant during QA to make environment obvious
5. **Settings**: Include in settings/about screen for support purposes

---

## Integration Examples

### Dashboard (Top Banner)

```tsx
// app/(tabs)/index.tsx
import { EnvironmentIndicator } from '@/components/ui';

export default function Dashboard() {
  return (
    <ScrollView>
      <EnvironmentIndicator variant="banner" />
      <HeroSection />
      {/* Rest of dashboard */}
    </ScrollView>
  );
}
```

### App Header (Badge)

```tsx
// components/navigation/AppHeader.tsx
import { EnvironmentIndicator } from '@/components/ui';

export function AppHeader() {
  return (
    <View style={styles.header}>
      <Logo />
      <EnvironmentIndicator />
    </View>
  );
}
```

### Settings Screen

```tsx
// app/(tabs)/settings.tsx
import { EnvironmentIndicator } from '@/components/ui';

export default function Settings() {
  return (
    <View>
      <Section title="Environment">
        <EnvironmentIndicator showInProduction={true} />
      </Section>
    </View>
  );
}
```

---

## Troubleshooting

### Indicator Not Showing

1. Check if you're in production and `showInProduction` is false
2. Verify Supabase URL is set in environment variables
3. Ensure component is imported correctly

### Wrong Environment Displayed

1. Verify `EXPO_PUBLIC_SUPABASE_URL` in your `.env` file
2. Check that you're loading the correct `.env` file
3. Restart the development server after changing `.env`

### Styling Issues

The component uses inline styles. To customize, wrap it in a View:

```tsx
<View style={{ position: 'absolute', top: 10, right: 10 }}>
  <EnvironmentIndicator />
</View>
```

---

## Related

- `@/config/env` - Environment configuration
- `getEnvironmentFromUrl()` - Environment detection utility
- `.env.development` - Development environment config
- `.env.staging` - Staging environment config
- `.env.production` - Production environment config

---

**Status:** Ready to use
**Location:** `components/ui/EnvironmentIndicator.tsx`
**Export:** Available from `@/components/ui`
