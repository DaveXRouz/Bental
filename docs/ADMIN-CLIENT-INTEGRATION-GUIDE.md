# Admin Panel → Client Integration Guide

## Overview

The Admin Panel now has **full real-time control** over client applications. Admins can toggle features, enable/disable functionality, and control app behavior—all changes sync **instantly** to connected clients via Supabase real-time subscriptions.

---

## ✅ Implemented Features

### 1. **Feature Flags System**

Admins can toggle features that immediately affect all clients.

**Available Flags:**
- `admin_panel` - Enable/disable admin panel access
- `new_ui_design` - Enable new UI design
- `advanced_charts` - Enable advanced charting features
- `social_trading` - Enable social trading features
- `dark_mode` - Enable dark mode theme

**Admin Panel Location:** Configuration → Feature Flags tab

**Client Usage:**
```typescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const socialTradingEnabled = useFeatureFlag('social_trading');

  return (
    <View>
      {socialTradingEnabled && (
        <SocialTradingFeature />
      )}
    </View>
  );
}
```

**Multiple Flags:**
```typescript
import { useFeatureFlags } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const flags = useFeatureFlags(['social_trading', 'advanced_charts']);

  return (
    <View>
      {flags.social_trading && <SocialTradingFeature />}
      {flags.advanced_charts && <AdvancedCharts />}
    </View>
  );
}
```

---

### 2. **App Configuration System**

Admins can control core app settings that affect all users.

**Available Settings:**
- `app_name` - Application name (string)
- `maintenance_mode` - Enable/disable entire app (boolean)
- `allow_new_registrations` - Allow/block new signups (boolean)
- `trading_enabled` - Enable/disable trading functionality (boolean)
- `bots_enabled` - Enable/disable AI trading bots (boolean)

**Admin Panel Location:** Configuration → Settings tab

**Client Usage (Full Config):**
```typescript
import { useAppConfig } from '@/hooks/useAppConfig';

function MyComponent() {
  const {
    app_name,
    maintenance_mode,
    trading_enabled,
    bots_enabled,
    loading
  } = useAppConfig();

  if (loading) return <Loading />;

  return (
    <View>
      <Text>{app_name}</Text>
      {trading_enabled && <TradeButton />}
      {bots_enabled && <BotFeatures />}
    </View>
  );
}
```

**Client Usage (Single Value):**
```typescript
import { useConfigValue } from '@/hooks/useAppConfig';

function MyComponent() {
  const tradingEnabled = useConfigValue('trading_enabled', true);

  return (
    <View>
      {tradingEnabled && <TradeButton />}
    </View>
  );
}
```

---

### 3. **Maintenance Mode**

When admin enables maintenance mode, all non-admin users see a maintenance screen.

**How It Works:**
1. Admin toggles `maintenance_mode` in Configuration
2. Change syncs instantly to all clients
3. App shows `MaintenanceMode` component to regular users
4. Admins can still access admin panel

**Implementation:**
```typescript
// Already integrated in app/index.tsx
if (maintenance_mode && userRole !== 'admin') {
  return <MaintenanceMode />;
}
```

**Custom Messages:**
```typescript
<MaintenanceMode
  message="We're upgrading our systems. Back in 30 minutes!"
/>
```

---

### 4. **User Password Reset**

Admins can reset any user's password.

**Admin Panel Location:** Users page → User Card → Reset Password button

**What Happens:**
1. Admin clicks "Reset Password" on user card
2. Confirms the action
3. User's password is changed to `Welcome2025!`
4. User must log in with new password

**Database Function:**
```sql
SELECT admin_update_user_password('user@example.com', 'Welcome2025!');
```

---

## 🔄 Real-Time Sync

All changes sync instantly via Supabase real-time subscriptions.

**How It Works:**
1. Admin makes change in admin panel
2. Database updates immediately
3. Supabase broadcasts change via WebSocket
4. All connected clients receive update
5. Client UI updates automatically

**Latency:** <100ms typically

**Channels Used:**
- `feature-flag-{flagName}` - Individual feature flags
- `feature-flags-multiple` - Multiple flags
- `app-config-sync` - App configuration changes
- `config-{key}` - Individual config values

---

## 📊 Example Use Cases

### Use Case 1: Disable Trading During Maintenance

**Admin Action:**
1. Go to Configuration → Settings
2. Toggle `trading_enabled` OFF
3. Save changes

**Client Effect:**
- Trade button becomes disabled
- Banner appears: "Trading is temporarily disabled by admin"
- Order submission blocked with alert

**Implementation:**
```typescript
// app/(tabs)/trade.tsx
const { trading_enabled } = useAppConfig();

const handleSubmitOrder = () => {
  if (!trading_enabled) {
    Alert.alert(
      'Trading Disabled',
      'Trading is temporarily disabled. Please try again later.'
    );
    return;
  }
  // Process order...
};

return (
  <>
    {!trading_enabled && (
      <View style={styles.disabledBanner}>
        <AlertCircle size={18} color="#ef4444" />
        <Text>Trading is temporarily disabled by admin</Text>
      </View>
    )}
  </>
);
```

---

### Use Case 2: Enable Beta Feature for Testing

**Admin Action:**
1. Go to Configuration → Feature Flags
2. Toggle `social_trading` ON
3. Save changes

**Client Effect:**
- Social trading tab appears in navigation
- Social trading features become accessible
- All users see new functionality instantly

**Implementation:**
```typescript
const socialTradingEnabled = useFeatureFlag('social_trading');

<Tabs>
  <Tabs.Screen name="home" />
  <Tabs.Screen name="trade" />
  {socialTradingEnabled && (
    <Tabs.Screen name="social" />
  )}
</Tabs>
```

---

### Use Case 3: Emergency Maintenance

**Admin Action:**
1. Go to Configuration → Settings
2. Toggle `maintenance_mode` ON
3. Save changes

**Client Effect:**
- All regular users immediately see maintenance screen
- Cannot access app functionality
- Admins still have full access
- Page auto-refreshes when maintenance ends

**Result:** Clean, professional downtime experience

---

## 🎨 UI Components

### FeatureBanner

Display informational banners when features are disabled.

```typescript
import { FeatureBanner } from '@/components/ui/FeatureBanner';

<FeatureBanner
  type="disabled" // or "maintenance" | "info"
  message="Trading is temporarily disabled by admin"
  visible={!trading_enabled}
/>
```

### MaintenanceMode

Full-screen maintenance mode component.

```typescript
import { MaintenanceMode } from '@/components/screens/MaintenanceMode';

<MaintenanceMode
  message="We're currently upgrading our systems. We'll be back soon!"
/>
```

---

## 🔐 Security

### Admin-Only Access

Only users with `role = 'admin'` can:
- Access admin panel
- View/modify feature flags
- Change app configuration
- Reset user passwords
- View activity logs

### RLS Policies

All admin operations are protected by Row Level Security:
- Feature flags: Only admins can UPDATE
- App configuration: Only admins can UPDATE
- User management: Admin functions only

### Audit Trail

All admin actions are logged to `admin_activity_logs`:
- Action type
- Target entity
- Changes made
- Timestamp
- Admin user ID

---

## 🚀 Adding New Feature Flags

### Step 1: Add to Database

```sql
INSERT INTO feature_flags (flag_name, is_enabled, description)
VALUES ('my_new_feature', false, 'Description of my new feature');
```

### Step 2: Use in Client

```typescript
const myFeatureEnabled = useFeatureFlag('my_new_feature');

{myFeatureEnabled && <MyNewFeature />}
```

### Step 3: Admin Toggles

Admin can now toggle your feature in Configuration → Feature Flags

---

## 🚀 Adding New Config Values

### Step 1: Add to Database

```sql
INSERT INTO app_configuration (category, key, value, description, data_type, is_public)
VALUES ('features', 'max_daily_trades', 100, 'Maximum trades per day', 'number', false);
```

### Step 2: Use in Client

```typescript
const maxTrades = useConfigValue<number>('max_daily_trades', 100);

if (userTrades >= maxTrades) {
  Alert.alert('Daily limit reached');
}
```

---

## 📱 Supported Platforms

- ✅ **Web** - Full support
- ✅ **iOS** - Full support (via Expo)
- ✅ **Android** - Full support (via Expo)

Real-time sync works on all platforms via WebSocket connections.

---

## 🐛 Troubleshooting

### Feature flag not updating?

1. Check network connection
2. Verify Supabase WebSocket connection
3. Check browser console for errors
4. Refresh the page

### Maintenance mode not showing?

1. Verify user role is not 'admin'
2. Check `maintenance_mode` value in database
3. Clear app cache and reload

### Trading still enabled after disable?

1. Check real-time subscription is active
2. Verify `trading_enabled` in database is `false`
3. Check for cached values

---

## 📚 API Reference

### useFeatureFlag(flagName)

Returns boolean indicating if feature is enabled.

**Parameters:**
- `flagName` (string) - Name of feature flag

**Returns:** boolean

**Example:**
```typescript
const enabled = useFeatureFlag('social_trading');
```

---

### useFeatureFlags(flagNames)

Returns object with multiple feature flag states.

**Parameters:**
- `flagNames` (string[]) - Array of flag names

**Returns:** Record<string, boolean>

**Example:**
```typescript
const flags = useFeatureFlags(['social_trading', 'advanced_charts']);
// { social_trading: true, advanced_charts: false }
```

---

### useAppConfig()

Returns entire app configuration object.

**Returns:** AppConfig & { loading: boolean }

**Example:**
```typescript
const { trading_enabled, bots_enabled, loading } = useAppConfig();
```

---

### useConfigValue(key, defaultValue)

Returns single configuration value.

**Parameters:**
- `key` (string) - Config key name
- `defaultValue` (T) - Default value if not found

**Returns:** T

**Example:**
```typescript
const tradingEnabled = useConfigValue('trading_enabled', true);
```

---

## 🎯 Best Practices

1. **Always provide defaults** - Handle loading states and provide sensible defaults
2. **Use feature flags for new features** - Easier rollback and gradual rollout
3. **Test thoroughly** - Verify behavior when flags are ON and OFF
4. **Document new flags** - Update this guide when adding new flags
5. **Monitor performance** - Real-time subscriptions use WebSockets, monitor connection health
6. **Graceful degradation** - App should work even if real-time sync fails

---

## 🔮 Future Enhancements

Potential additions:
- [ ] Rollout percentage (gradual feature rollout)
- [ ] Target specific users for beta testing
- [ ] Scheduled feature flags (auto-enable at specific time)
- [ ] A/B testing framework
- [ ] Feature flag analytics
- [ ] Client-side experiment tracking

---

*Last Updated: January 4, 2025*
